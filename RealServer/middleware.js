/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-27
 * Time: PM3:19
 * To change this template use File | Settings | File Templates.
 */

var Connection = require('./connection').Connection;
var connPool = require('./connection').connectionPool;
var userPool=require('./connection').userPool;
var common=require('./common');
var json2 = require('./json2').JSON;


var redis = require('redis'),
    redis_client = redis.createClient();

/**
 * 在没有登录的情况下，
 * 在已登录的情况下，建立连接时，会在redis中插入一项
 * 登录和未登录如何区别？
 * 登录状态下，npeasy:cookie:<cookie_val>:user_info_raw是有值的
 * 如果该用户的session已经保存在redis中，则设置request的user_id为redis中的user_id
 * @param req
 * @param res
 * @param next
 */
exports.establishCometConnectionMiddleWare=function establishCometConnectionMiddleWare(req, res, next) {
    var sessionId = req.cookies['npeasy.sid'];
    var connectionId = req.param('connectionId');
    //获知该连接所属的用户
    redis_client.get('npeasy:cookie:'+sessionId+':user_info_raw',function(err,user_info_raw){
        if(!err){
            try{
                var user_info=json2.parse(user_info_raw);
                req.userId=user_info.id;
            }catch(ex){
                console.log(ex.toString());
            }
        }
        try {
            if (sessionId !== undefined && connectionId !== undefined && connPool.add(new Connection(req, res, sessionId, connectionId))) {
                req.sessionId = sessionId;
                req.connectionId = connectionId;
                userPool.add(req.userId,sessionId,connectionId);//将该连接设置为某个用户所有
                next();
            } else {
                console.log('Comet connection middle ware, initialize sessionId and connectionId failed: sessionId ' + sessionId + " connectionId: " + connectionId);
                if (sessionId === undefined) {
                    res.jsonpCallback({event:'noSessionId', data:{}})
                } else if (connectionId === undefined) {
                    res.jsonpCallback({event:'noConnectionId', data:{}})
                }
            }
        } catch (ex) {
            console.log('Cannot add this connection sessionId: ' + sessionId + " connectionId: " + connectionId + " . Because its id has already exist in connection pool.");
            res.jsonpCallback({event:'connectionExists',data:{}})
        }
    });
}

exports.addJsonpCallbackFunction=function (req, res, next) {
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