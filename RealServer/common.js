/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-11
 * Time: 下午6:00
 * To change this template use File | Settings | File Templates.
 */
/**
 * 去除多余空格函数
 * dtrim:去除两边空格 lTrim:去除左空格 rTrim: 去除右空格
 * 用法：
 *     var str = "  hello ";
 *     str = str.dtrim();
 */
String.prototype.dtrim = function () {
    return this.replace(/(^[\\s]*)|([\\s]*$)/g, "");
};
String.prototype.ltrim = function () {
    return this.replace(/(^[\\s]*)/g, "");
};
String.prototype.rtrim = function () {
    return this.replace(/([\\s]*$)/g, "");
};
Array.prototype.remove = function (dx) {
    if (isNaN(dx) || dx > this.length) {
        return false;
    }
    return this.splice(dx, 1)[0];
};


var crypto = require('crypto');
//发送到npeasy的密码是多少（并不是谁都可以通过npeasy发送实时消息，只有收到认证的发送者才可以使用npeasy）
//TODO 应该做成每个app都有一个独特的postSecret
exports.postSecret="5199DED1ECBBF664AD4376306FD45F19";

exports.getUnixTimestamp = function getUnixTimestamp() {
    return new Date() * 1;
};


//generate an id of current node
var random_string=(""+Math.random());
exports.nodeId=random_string.slice(2,random_string.length-1);
//npeasy 节点id
exports.nodeId=1;
//隔多久清除一次超时僵尸连接
exports.cleanZombieInterval=100000;
//隔多久对超时活连接发送空信息
exports.sendDummyMessageInterval=26000;
//变成僵尸连接多久才算是超时的僵尸连接
exports.zombieTimeout=10000;
//多久的活连接是超时的活连接
exports.dummyMessageTimeout=50000;
//定义空信息
exports.dummyMessage={event:'dummy',data:{}}

exports.connectionExistMessage={event:'connectionExists',data:{}}

exports.refreshConnectionMessage={event:'refreshConnection',data:{}}

exports.identityConfirmedMessage={event:'identityConfirmed',data:{}}

exports.confirmIdentityMessage={event:'confirmIdentity',data:{}}

exports.debug=true;
var redis = require('redis'),
    redisClient = redis.createClient();

exports.redis=redis;
exports.redisClient=redisClient;
exports.JSON=require('./lib/json2').JSON;
exports._=require('underscore');