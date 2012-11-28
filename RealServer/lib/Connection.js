/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-28
 * Time: 晚上11:00
 * To change this template use File | Settings | File Templates.
 */

var common = require('../common');
var redisClient = common.redisClient;
var JSON = common.JSON;
var _=common._;

function ConnectionException() {
}
/**
 * 该对象对应于某个连接，当连接返回时，作为该连接的缓存区
 * @param req
 * @param res
 * @param sessionId
 * @param connectionId
 * @constructor
 */
function Connection(req, res, sessionId, connectionId) {
    this.sessionId = sessionId;
    this.connectionId = connectionId;
    this.alive = true;//该连接是否处于中断期
    this.request = req;
    this.response = res;
    this.dataBuffer = [];   //临时数据
    if (req.userId == undefined || req.userId == 0) {
        this.userId = undefined;   //是否是一个匿名连接用户
    } else {
        this.userId = req.userId;
    }
    this.timestamp = common.getUnixTimestamp(); //时间戳，建立本次连接的时间。
    // 在1.每次建立连接 2.发送向该连接发送实际数据（而不是放到缓存区） 的情况下都需要更新时间戳。
    // connPool每隔一段时间会清理过期的connection
    this.jsonpCallback = this.request.query.callback;
}
/**
 * 刷新连接的时间戳
 */
Connection.prototype.refreshTimestamp = function () {
    this.timestamp = common.getUnixTimestamp();
}
/**
 * 清空缓存区数据
 */
Connection.prototype.clearDataBuffer = function () {
    this.dataBuffer = [];
}

Connection.prototype.copy = function (conn) {
    this.alive = conn.alive;
    this.request = conn.request;
    this.response = conn.response;
    this.dataBuffer = conn.dataBuffer;
    this.userId = conn.userId;
    this.timestamp = conn.timestamp;
    this.jsonpCallback = conn.jsonpCallback;
}
/**
 * 通过这个连接向用户推送数据
 * 如果当前连接是僵尸的，即该连接的response已经返回给用户，但是浏览器还没重新连接，则将要发送的数据保存在数据缓存区中，并且返回false；
 * 如果当前连接是活的，则向该连接推送数据，并且设置该连接为僵尸连接
 * @param json 实际json，而非json字符串
 * @return {Boolean} 如果该连接本来是活连接，数据推送后返回true，如果该连接本来是僵尸连接，则将数据放入临时数据区后返回false
 */
Connection.prototype.sendCrossSiteJson = function (json) {
    //如果是僵尸连接
    if (this.alive === false) {
        this.dataBuffer.push(json); //存入缓存区完事
        return false;
    } else {
        try {
            this.response.jsonpCallback(json); //response.jsonpCallback方法是在连接初始化时候注册到response的方法
        } catch (ex) {
            console.log('jsonp callback response exception');
        }
        this.clearDataBuffer();
        this.alive = false;
        this.refreshTimestamp();
        return true;
    }
    return false;
}

exports.Connection = Connection;
exports.ConnectionException = ConnectionException;

exports.sendCrossSiteJson = function (connArray, json) {
    _.each(connArray, function (e) {
        e.sendCrossSiteJson(json);
    })
}