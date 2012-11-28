/**
 * 未登录的用户id默认为0
 *
 * npeasy:cookie:<cookie_val>:user_info_raw={"id":"1","email":"lubobill1990@163.com"}
 * npeasy:cookie:<cookie_val>:access_token=jqiowjfasdjvbajsfphasdfweqwe
 * npeasy:user_id:<user_id_val|0>:node_id:<node_id_val>=set(<cookie_val>+<connection_id>)
 *
 * @type {*}
 */
var common = require('./common');
var redis_client = common.redisClient;
var json2 = common.JSON;
var _ = common._;

var http = require('http');
var connection = require('./lib/Connection');
var connPool = require('./lib/ConnectionPool').connectionPool;
var userPool=require('./lib/UserPool').userPool;
var Connection=connection.Connection;
var UserConnections=require('./lib/UserConnections').UserConnections;

exports.getUserId = function (req, res, callback) {
    var redis_prefix = 'npeasy:cookie:' + req.cookies['npeasy.sid'];
    redis_client.get(redis_prefix + ':user_info_raw', function (err, data) {
        if (err) {
            //if such a key does not exist, return zero 0
            callback(0);
        } else {
            //if exists such a key,then the res is the user_id
            try {
                var user_info = json2.parse(data);
                callback(user_info.id);
            } catch (ex) {
                callback(0);
            }
        }
    })
}

exports.redirectToGetAuthCode = function (req, res) {
    res.writeHead(302, {
        'Location':'http://npeasy.com:13050/oAuth/getAuthorizedCode?app_key=1111'
    });
    res.end();
}

/**
 * oauth回调执行函数
 * 这个函数中，使用从主服务器通过重定向获取的auth_code和app_key/app_secret获取access_token
 * 再使用access_token获取user_info
 * @param req
 * @param res
 */
exports.callback = function (req, res) {
    var sessionId = req.cookies['npeasy.sid'];
    var redis_prefix = 'npeasy:cookie:' + req.cookies['npeasy.sid'];
    var request_access_token = http.request({
        host:'npeasy.com',
        port:13050,
        path:'/oAuth/getAccessToken?auth_code=' + req.param('auth_code') + '&app_key=1111&app_secret=1111',
        method:'GET'
    }, function (access_token_response) {
        var access_token = '';
        access_token_response.on('data', function (chunk) {
            access_token += chunk;
        })
        access_token_response.on('end', function () {//获得access_token
            redis_client.set(redis_prefix + ':access_token', access_token);//access_token存入redis，对应session_id
            var user_info_request = http.request({
                host:'npeasy.com',
                port:13050,
                path:'/oAuth/getUserInfo?access_token=' + access_token,
                method:'GET'
            }, function (user_info_response) {
                var user_info_raw = '';
                user_info_response.on('data', function (data) {
                    user_info_raw += data;
                })
                user_info_response.on('end', function () {//获得user_info
                    if (user_info_raw.length == 0) {
                        return;
                    }
                    try {
                        var user_info = json2.parse(user_info_raw);
                        //到这里，就知道某个session_id对应的user_id，就要将该session_id加入到userPool中
                        //userPool.add(user_info.id, sessionId, 0);//这一步应该是可以去掉的 TODO
                        connection.sendCrossSiteJson(_.map(connPool.getSessionConnections(sessionId), function (val, key) {
                            return val;
                        }), common.dummyMessage);
                        redis_client.set(redis_prefix + ':user_info_raw', user_info_raw);//保存某个session_id对应的user_info
                    } catch (ex) {
                        console.log(ex.toString());
                    }
                    res.send(user_info_raw);
                })
            })
            user_info_request.end();
        })
    })
    request_access_token.end();

}