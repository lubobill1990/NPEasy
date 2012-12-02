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
var _ = require('underscore');
var events = require('events');

var util = require('util');
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
    var connPool = this.connPool = {};
    this.connCleanList;
    this.connTotalAmount = 0;  //每加入一个以前不存在的connection自增1，自动清理时，每删除一个自减1
    this.connAlivedAmount = 0; //每加入一个以前不存在的或者重建一个僵尸连接自增1，每向一个connection发送一个消息自减1
    var cleanConnectionFunction = this.cleanZombieConnection;
    var sendDummyMessageToTimeoutConnection = this.sendDummyMessageToTimeoutConnection;
    setInterval(function () {
        cleanConnectionFunction(connPool);
    }, common.cleanZombieInterval);
    setInterval(function () {
        sendDummyMessageToTimeoutConnection(connPool);
    },common.sendDummyMessageInterval);
}


ConnectionPool.prototype.sendDummyMessageToTimeoutConnection = function (connPool) {
    //每隔一段时间进行清理
    var currentTime = common.getUnixTimestamp();//获取当前时间
    console.log('send dummy message, time: ' + currentTime);
    for (var i in connPool) {
        if (connPool.hasOwnProperty(i)) {//对于每个session的所有连接
            if (Object.keys(connPool[i]).length !== 0) {
                for (var j in connPool[i]) {
                    if (connPool[i].hasOwnProperty(j) && connPool[i][j] instanceof Connection) {//对于session中的每个连接
                        //检查过期的连接
                        if (currentTime - connPool[i][j].timestamp > common.dummyMessageTimeout) {//如果离上次监听的时间过长
                            if (connPool[i][j].alive) {//如果是超时活连接，则发送空信息
                                connPool[i][j].sendCrossSiteJson(common.dummyMessage);
                            }
                        }
                    }
                }
            }
        }
    }
}
ConnectionPool.prototype.cleanZombieConnection = function (connPool) {
    //每隔一段时间进行清理
    var currentTime = common.getUnixTimestamp();//获取当前时间
    console.log('cleaning, time: ' + currentTime);
    for (var i in connPool) {
        if (connPool.hasOwnProperty(i)) {//对于每个session的所有连接
            if (Object.keys(connPool[i]).length !== 0) {
                for (var j in connPool[i]) {
                    if (connPool[i].hasOwnProperty(j) && connPool[i][j] instanceof Connection) {//对于session中的每个连接
                        //检查过期的连接
                        if (currentTime - connPool[i][j].timestamp > common.zombieTimeout) {//如果离上次监听的时间过长
                            //如果是僵尸连接，则删除
                            if (connPool[i][j].alive == false) {

//                            if (!connPool[i][j].sendCrossSiteJson({event:'connectionTimeout', data:{}})) {//发回空数据
//                                delete connPool[i][j];//如果该连接本来就是死的，则删除该连接
//                                console.log('clean pool');
//                            }
                                connPool[i][j].sendCrossSiteJson({event:'connectionTimeout', data:{}});
                                //删除该连接对应的用户connection中的连接
                                var userConnections = userPool.getUserConnectionPool(connPool[i][j].userId);
                                if (userConnections != undefined) {
                                    userConnections.del(connPool[i][j].sessionId, connPool[i][j].connectionId);
                                }
                                delete connPool[i][j];//删除该实际连接
                                this.connAlivedAmount--;
                                this.connTotalAmount--;
                                console.log('clean pool');
                            } else {//如果是超时活连接，则发送空信息
                                connPool[i][j].sendCrossSiteJson(common.dummyMessage);
                            }
                        }
                    }
                }
            }
            if (Object.keys(connPool[i]).length == 0) { //如果某个session的所有连接都被清理掉了，则把这个session连接容器也清理掉
                delete connPool[i];
            }
        }
    }

}
exports.connectionPool = new ConnectionPool();

var userPool=require('./UserPool').userPool;
var ConnectionException=require('./Connection').ConnectionException;
var Connection=require('./Connection').Connection;



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
                //throw new ConnectionException();
                //如果还活着，说明前一个还没结束或者前一个意外退出，则将前一个连接覆盖掉
                oldConn.sendCrossSiteJson(common.connectionExistMessage);
                oldConn.copy(conn);
                return true;
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

