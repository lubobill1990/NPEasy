/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-11
 * Time: 下午7:00
 * To change this template use File | Settings | File Templates.
 */


var common = require('./common');
var redis = require('redis'),
    redisClient = redis.createClient();
var JSON = require('./json2').JSON;
var _=require('underscore');
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
    this.isGuest = true;   //是否是一个匿名连接用户
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
    this.alive=conn.alive;
    this.request=conn.request;
    this.response=conn.response;
    this.dataBuffer=conn.dataBuffer;
    this.isGuest=conn.isGuest;
    this.timestamp=conn.timestamp;
    this.jsonpCallback=conn.jsonpCallback;
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


/**
 * 该对象将所有连接储存起来
 * 使用session_id可以获取某session下的所有connection对象
 * 使用session_id和connection_id可以获取某个特定的connection对象
 *
 * connPool的数据结构：
 * 1. 需要根据时间戳，自动清理，所以需要根据时间戳排序
 * 2. 应该提供session_id和connection_id的map
 * @constructor
 */
function ConnectionPool() {
    this.connPool = {};
    this.connCleanList;
    this.connTotalAmount = 0;  //每加入一个以前不存在的connection自增1，自动清理时，每删除一个自减1
    this.connAlivedAmount = 0; //每加入一个以前不存在的或者重建一个僵尸连接自增1，每向一个connection发送一个消息自减1
}
ConnectionPool.prototype.getConnections = function () {
    return this.connPool;
}
ConnectionPool.prototype.getConnection = function (sessionId, connectionId) {
    try {
        return this.connPool[sessionId][connectionId];
    } catch (ex) {
        return undefined;
    }
}
/**
 * 设置connection
 * @param conn
 */
ConnectionPool.prototype.setConnection = function (conn) {
    if (this.connPool[conn.sessionId] === undefined) {
        this.connPool[conn.sessionId] = {};
    }
    this.connPool[conn.sessionId][conn.connectionId] = conn;
}

ConnectionPool.prototype.getSessionConnections = function (sessionId) {
    try {
        return this.connPool[sessionId];
    } catch (ex) {
        return undefined;
    }
}


/**
 * 向连接池添加连接
 * 如果不存在该connectionId的连接，则添加，并且返回true
 * 如果已经存在该connectionId的活动连接，则抛出异常
 * 如果该连接是一个僵尸连接，并且其临时数据区存在数据，则将数据返回，设置新的timestamp，并且返回false
 * 如果该连接是一个僵尸连接，并且其临时数据区不存在数据，则设置新的变量，并且返回true
 * @param conn
 * @return {boolean} 返回false说明不需要做后续操作了
 */
ConnectionPool.prototype.add = function (conn) {
    if (conn instanceof Connection) {
        var oldConn = this.getConnection(conn.sessionId, conn.connectionId)
        if (oldConn === undefined) { //如果该conn不存在，则添加
            this.connAlivedAmount++;
            this.connTotalAmount++;
            this.setConnection(conn);
            return true;
        } else {//如果conn存在
            if (oldConn.alive) {//并且还活着，这不是正常的事情，所以抛出异常
                throw new ConnectionException();
            } else if (oldConn.dataBuffer.length != 0) {//并且是僵尸连接，还有缓存数据
                //则发送跨域数据
                conn.sendCrossSiteJson(oldConn.dataBuffer);
                oldConn.alive = false;
                oldConn.clearDataBuffer();
                oldConn.refreshTimestamp();
                return false;
            } else {//并且是僵尸连接并且没有缓存数据
                oldConn.copy(conn);
                return true;
            }
        }
    } else {
        throw new ConnectionException();
    }
}


exports.Connection = Connection;
exports.connectionPool = new ConnectionPool();
exports.ConnectionException = ConnectionException;

function UserConnections(userId) {
    this.sessions = {};
    this.userId = userId;
    this.connectionArrayBuffer = [];
    this.bufferExpired = true;
}
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
UserConnections.prototype.getConnections = function () {
    if (!this.bufferExpired) {//如果connection array的结果还没有过期，则直接返回缓存区即可
        return this.connectionArrayBuffer
    }
    var retVal = [];
    Object.keys(this.sessions).forEach(function (e) {
        retVal=retVal.concat(_.map(exports.connectionPool.getSessionConnections(e), function (ele,key) {
            return ele;
        }));
    })
    //console.log(retVal);
    this.bufferExpired = false;
    this.connectionArrayBuffer = retVal;
    return retVal;
}

/**
 * 既可以通过userid获得user的connections
 * @constructor
 */
function UserPool(){
    this.users={};
}

UserPool.prototype.getUserConnectionPool=function(userId){
    return this.users[userId];
}
/**
 * 将sessionId和connectionId对应的connection设置为某个用户id所有
 * 在establish connection的中间件中调用
 * @param userId
 * @param sessionId
 * @param connectionId
 */
UserPool.prototype.add=function(userId,sessionId,connectionId){
    if(userId===undefined){
        return;
    }
    if(this.users[userId]===undefined){
        this.users[userId]=new UserConnections(userId);
    }
    this.users[userId].add(sessionId,connectionId);
}

exports.userPool=new UserPool();
exports.sendCrossSiteJson=function(connArray,json){
    _.each(connArray,function(e){
        e.sendCrossSiteJson(json);
    })
}