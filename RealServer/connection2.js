/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-11
 * Time: 下午7:00
 * To change this template use File | Settings | File Templates.
 */


var common=require('./common');
var redis = require('redis'),
    redisClient=redis.createClient();
var JSON = require('./json2').JSON;

function Connection(req, res, sessionId, connectionId){
    this.sessionId=sessionId;
    this.connectionI=connectionId;
    this.alive=true;
    this.request=req;
    this.response=res;
    this.data=[];
    this.isGuest;
}