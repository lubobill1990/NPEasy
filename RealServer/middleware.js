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
        } else {
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
exports.establishCometConnectionMiddleWare = function establishCometConnectionMiddleWare(req, res, next) {
    var sessionId = req.sessionId;
    var connectionId = req.connectionId;
    //获知该连接所属的用户
    redisClient.get('npeasy:cookie:' + sessionId + ':user_info_raw', function (err, user_info_raw) {
        if (!err) {
            try {
                var user_info = json2.parse(user_info_raw);
                req.userId = user_info.id;
            } catch (ex) {
                req.userId=undefined;
            }
        }
        if (connPool.add(new Connection(req, res, sessionId, connectionId))) {
            userPool.add(req.userId, sessionId, connectionId);//将该连接设置为某个用户所有
            next();
        }
    });
}

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

exports.checkSenderPermission=function(req,res,next){
    next();
}