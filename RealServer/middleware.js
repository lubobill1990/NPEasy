/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-27
 * Time: PM3:19
 * To change this template use File | Settings | File Templates.
 */

var connection = require('./lib/Connection');
var connPool = require('./lib/ConnectionPool').connectionPool;
var userPool = require('./lib/UserPool').userPool;
var Connection = connection.Connection;

var common = require('./common');
var json2 = common.JSON;


var redisClient = common.redisClient;

/**
 * 过滤掉没有必须参数的连接
 * @param req
 * @param res
 * @param next
 */
exports.filterConnection = function (req, res, next) {
    var sessionId = req.cookies['npeasy.sid'];
    var connectionId = req.param('connectionId');
    if (sessionId != undefined && connectionId != undefined) {
        req.sessionId = sessionId;
        req.connectionId = connectionId;
        next();
    } else {
        if (sessionId === undefined) {
            res.jsonpCallback({event:'noSessionId', data:{}})
        } else if (connectionId === undefined) {
            res.jsonpCallback({event:'noConnectionId', data:{}})
        } else if (common.debug) {
            throw "This can never happen";
        }
    }
}
/**
 * NOTICE:确保之前已经调用了filterConnection
 * 在没有登录的情况下，
 * 在已登录的情况下，建立连接时，会在redis中插入一项
 * 登录和未登录如何区别？
 * 登录状态下，npeasy:cookie:<cookie_val>:user_info_raw是有值的
 * 如果该用户的session已经保存在redis中，则设置request的user_id为redis中的user_id
 * @param req
 * @param res
 * @param next
 */
exports.addConnectionToPool = function addConnectionToPool(req, res, next) {
    //只有添加连接正确才进入下一步
    if(connPool.add(new Connection(req, res, req.sessionId, req.connectionId))){
        next();
    }
}

/**
 * 获取用户身份，如果已经有身份，则将连接加入用户连接池中
 * @param req
 * @param res
 * @param next
 */
exports.addConnectionToUserPool = function (req, res, next) {
    redisClient.get('npeasy:cookie:' + req.sessionId + ':user_info_raw', function (err, user_info_raw) {
        if (!err) {
            try {
                var user_info = json2.parse(user_info_raw);
                req.userId = user_info.id;
            } catch (ex) {
                req.userId = undefined;
            }
        }
        userPool.add(req.userId, req.sessionId, req.connectionId);//将该连接设置为某个用户所有

        next();
    });
}

/**
 * 在建立连接时，第一步就为连接添加jsonpCallback的函数
 * @param req
 * @param res
 * @param next
 */
exports.addJsonpCallbackFunction = function (req, res, next) {
    res.jsonpCallback = function (json) {
        try {
            json2.stringify(json)
        } catch (ex) {
            json = {data:json}
        }
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(req.query.callback + '(' + json2.stringify(json) + ')');
    }
    next();
}

/**
 * 检验从用户服务器上传来的数据是否密码正确
 * @param req
 * @param res
 * @param next
 */
exports.checkSenderPermission = function (req, res, next) {
    if (req.param('postSecret') == common.postSecret) {
        next();
    } else {
        res.send('post keyword is not right');
    }
}