/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-28
 * Time: 晚上11:00
 * To change this template use File | Settings | File Templates.
 */


/**
 * 既可以通过userid获得user的connections
 * @constructor
 */
function UserPool() {
    this.users = {};
}
exports.userPool = new UserPool();

var common = require('../common');
var redisClient = common.redisClient;

var JSON = common.JSON;
var _ = require('underscore');
var events = require('events');

var util = require('util');

var UserConnections = require('./UserConnections').UserConnections;
var broadcaster = require('./Broadcaster').broadcaster;

UserPool.prototype.getUserConnectionPool = function (userId) {
    return this.users[userId];
}

UserPool.prototype.getUsersConnectionPool = function (userIdArray) {
    _.reduce(userIdArray,function(memo,ele){
        return memo.concat(this.users[ele])
    })
}

/**
 * 将sessionId和connectionId对应的connection设置为某个用户id所有
 * 在establish connection的中间件中调用
 * @param userId
 * @param sessionId
 * @param connectionId
 */
UserPool.prototype.add = function (userId, sessionId, connectionId) {
    if (userId === undefined) {
        return;
    }
    if (this.users[userId] === undefined) {
        this.users[userId] = new UserConnections(userId);
        //将node节点id加入到npeasy:userId:<id>:nodeId中去
        redisClient.hset('npeasy:userId:' + userId + ':connectionOn', common.nodeId, '1', function (seterr, setres) {
            if (!seterr) {
                redisClient.hlen('npeasy:userId:' + userId + ':connectionOn', function (err, res) {
                    if (!err && res == 1) {//如果当时redis中保存的nodeId只有一个，即为刚刚保存的nodeId，则触发这个用户上线的事件
                        broadcaster.emit('online', userId);
                    }
                })
            }
        });
    }
    this.users[userId].add(sessionId, connectionId);
}
UserPool.prototype.del = function (userId) {
    delete this.users[userId];
}
