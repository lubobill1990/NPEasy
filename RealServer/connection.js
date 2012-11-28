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
var _ = require('underscore');
var events = require('events');

var util = require('util');


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

function UserConnections(userId) {
    this.sessions = {};
    this.userId = userId;
    this.connectionArrayBuffer = [];
    this.bufferExpired = true;
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
    var connPool = this.connPool = {};
    this.connCleanList;
    this.connTotalAmount = 0;  //每加入一个以前不存在的connection自增1，自动清理时，每删除一个自减1
    this.connAlivedAmount = 0; //每加入一个以前不存在的或者重建一个僵尸连接自增1，每向一个connection发送一个消息自减1
    var cleanConnectionFunction = this.cleanZombieConnection;
    var sendDummyMessageToTimeoutConnection = this.sendDummyMessageToTimeoutConnection;
    setInterval(function () {
        cleanConnectionFunction(connPool);
    }, 3000);
    setInterval(function () {
        sendDummyMessageToTimeoutConnection(connPool);
    },10000);
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
                        if (currentTime - connPool[i][j].timestamp > common.getTimeoutMSeconds()) {//如果离上次监听的时间过长
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
                        if (currentTime - connPool[i][j].timestamp > common.getTimeoutMSeconds()) {//如果离上次监听的时间过长
                            //如果是僵尸连接，则删除
                            if (connPool[i][j].alive == false) {

//                            if (!connPool[i][j].sendCrossSiteJson({event:'connectionTimeout', data:{}})) {//发回空数据
//                                delete connPool[i][j];//如果该连接本来就是死的，则删除该连接
//                                console.log('clean pool');
//                            }
                                connPool[i][j].sendCrossSiteJson({event:'connectionTimeout', data:{}});
                                //删除该连接对应的用户connection中的连接
                                var userConnections = exports.userPool.getUserConnectionPool(connPool[i][j].userId);
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
/**
 * 既可以通过userid获得user的connections
 * @constructor
 */
function UserPool() {
    this.users = {};
}
exports.userPool = new UserPool();
exports.Connection = Connection;
exports.connectionPool = new ConnectionPool();
exports.ConnectionException = ConnectionException;
function Broadcaster() {
    events.EventEmitter.call(this);
}
util.inherits(Broadcaster, events.EventEmitter);
broadcaster = new Broadcaster();
broadcaster.addListener('logout', function (userId) {
    console.log(userId + " logout")
});
broadcaster.addListener('online', function (userId) {
    console.log(userId + " online")
    var c_p = exports.connectionPool.getConnections();
    for (var i in c_p) {
        if (c_p.hasOwnProperty(i)) {//对于每个session的所有连接
            for (var j in c_p[i]) {
                c_p[i][j].sendCrossSiteJson({'event':'login', data:{b:123}});
            }
        }
    }
})

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
                oldConn.sendCrossSiteJson(common.dummyMessage);
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
        var userId=this.userId;
        redisClient.hdel('npeasy:userId:' + this.userId + ":connectionOn", common.nodeId, function (delerr, delres) {
            if (!delerr) {
                //到redis中查找目前该用户在线的个数
                redisClient.hlen("npeasy:userId:" +userId + ":connectionOn", function (err, res) {
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
        exports.userPool.del(this.userId);
    }
}
UserConnections.prototype.getConnections = function () {
    if (!this.bufferExpired) {//如果connection array的结果还没有过期，则直接返回缓存区即可
        return this.connectionArrayBuffer
    }
    var retVal = [];
    Object.keys(this.sessions).forEach(function (e) {
        retVal = retVal.concat(_.map(exports.connectionPool.getSessionConnections(e), function (ele, key) {
            return ele;
        }));
    })
    //console.log(retVal);
    this.bufferExpired = false;
    this.connectionArrayBuffer = retVal;
    return retVal;
}


UserPool.prototype.getUserConnectionPool = function (userId) {
    return this.users[userId];
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


exports.sendCrossSiteJson = function (connArray, json) {
    _.each(connArray, function (e) {
        e.sendCrossSiteJson(json);
    })
}