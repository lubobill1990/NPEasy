/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-28
 * Time: 晚上11:00
 * To change this template use File | Settings | File Templates.
 */


function UserConnections(userId) {
    this.sessions = {};
    this.userId = userId;
    this.connectionArrayBuffer = [];
    this.bufferExpired = true;
}


exports.UserConnections = UserConnections;

var common = require('../common');
var redisClient = common.redisClient;
var JSON = common.JSON;
var _ = require('underscore');
var events = require('events');

var util = require('util');
broadcaster = require('./Broadcaster').broadcaster;
userPool = require('./UserPool').userPool;
connPoolGlobal = require('./ConnectionPool').connectionPool;
connection = require('./Connection');
/**
 * 同一个session下的所有connection一定是该用户的，所以只需存一个session即可
 * @param sessionId
 */
UserConnections.prototype.add = function (sessionId, connectionId) {
    if (this.sessions[sessionId] === undefined) {
        this.sessions[sessionId] = {};
    }
    if (this.sessions[sessionId][connectionId] === undefined) {
        //如果要添加的connection不存在，则添加并且把临时数据设为过期，清空缓存数据
        this.sessions[sessionId][connectionId] = true;
        this.bufferExpired = true;
        this.connectionArrayBuffer = [];
    }
}
UserConnections.prototype.del = function (sessionId, connectionId) {
    if (this.sessions[sessionId] == undefined) {
        return;
    }
    delete this.sessions[sessionId][connectionId];
    if (Object.keys(this.sessions[sessionId]).length == 0) {
        delete this.sessions[sessionId];
    }
    if (Object.keys(this.sessions).length == 0) {//如果该userId对应的用户在本npeasy实例上的连接数已经为0
        var userId = this.userId;
        redisClient.hdel('npeasy:userId:' + this.userId + ":connectionOn", common.nodeId, function (delerr, delres) {
            if (!delerr) {
                //到redis中查找目前该用户在线的个数
                redisClient.hlen("npeasy:userId:" + userId + ":connectionOn", function (err, res) {
                    if (!err) {
                        //如果已经全部下线，则发送事件，说明这个用户的下线行为
                        if (res == 0) {
                            //触发事件，表明这个用户已经下线
                            broadcaster.emit('logout', userId);
                        }
                    }
                })
            }
        })

        //从UserPool中删除该用户
        userPool.del(this.userId);
    }
}
UserConnections.prototype.getConnections = function () {
    if (!this.bufferExpired) {//如果connection array的结果还没有过期，则直接返回缓存区即可
        return this.connectionArrayBuffer
    }
    var retVal = [];

    Object.keys(this.sessions).forEach(function (sessionId) {
        var sessionConnections = connPoolGlobal.getSessionConnections(sessionId);
        Object.keys(sessionConnections).forEach(function (connectionId) {
            retVal.push(sessionConnections[connectionId])
        })
    })
    //console.log(retVal);
    this.bufferExpired = false;
    this.connectionArrayBuffer = retVal;
    return retVal;
}

UserConnections.prototype.sendCrossSiteJson = function (json) {
    var connections = this.getConnections();
    connection.sendCrossSiteJson(connections, json);

}