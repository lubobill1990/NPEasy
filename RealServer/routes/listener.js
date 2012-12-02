/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-29
 * Time: AM1:41
 * To change this template use File | Settings | File Templates.
 */

var common=require('../common');
var connPool=require('../lib/ConnectionPool').connectionPool;
var redisClient=common.redisClient;
exports.listen=function(req,res){

}
exports.refreshConnection=function(req,res){
    try{
        var connection=connPool.getConnections()[req.sessionId][req.connectionId]
        connection.sendCrossSiteJson(common.refreshConnectionMessage);
    }catch(ex){
        console.log(ex.toString());
    }
    res.jsonpCallback({event:'refreshSuccess',data:{}});
}
exports.subscribe=function(req,res){

}
exports.unsubscribe=function(req,res){

}

exports.getUserList=function(req,res){
    redisClient.smembers('npeasy:userList',function(err,users){
        res.jsonpCallback(users);
    })
}