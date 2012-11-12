/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-8-28
 * Time: 下午3:44
 * To change this template use File | Settings | File Templates.
 */
var common=require('./common');
var redis = require('redis'),
    redisClient=redis.createClient();
var JSON = require('./json2').JSON;

function RedisList(name){
    this.key=name;
}
RedisList.prototype.push=function(val){
    redisClient.rpush(this.name,val);
    this.setExpire(100);
}
RedisList.prototype.getData=function(callback){
    redisClient.lrange(this.name,0,-1,function(err,res){
        if(err){
            callback([]);
        }else{
            callback(res);
        }
    })
}
RedisList.prototype.clear=function(){
    redisClient.del(this.name,function(err,res){});
}
RedisList.prototype.setExpire=function(seconds){
    redisClient.expire(this.name,seconds);
}
function ConnectionException() {
}


function Connection(req, res, sessionId, connectionId) {
    this.alive = true;//这个连接上是否有活的连接
    this.sessionId = sessionId;
    this.connectionId = connectionId;
    this.request = req;
    this.response = res;
    this.tmpData = [];
    this.redisTmpArray=new RedisList('NPE:connTmpData:'+common.composeMd5Id(sessionId,connectionId));
    this.jsonpCallback = this.request.query.callback;
    this.timestamp = common.getUnixTimestamp();
}
/**
 * 通过这个连接向用户推送数据
 * 如果当前连接没有用户的活连接，或者说该连接是死的，则将要发送的数据保存在临时数据区中，并且返回false；
 * 如果当前连接是活的，则向该连接推送数据，并且设置该连接为非活动（死的）连接
 * @param json
 * @return {Boolean} 如果该连接本来是活连接，数据推送后返回true，如果该连接本来是死连接，则将数据放入临时数据区后返回false
 */
Connection.prototype.sendCrossSiteJson = function (json) {

    if (this.alive ===false) {
        this.tmpData.push(json);
        this.redisTmpArray.push(JSON.stringify(json));
        console.log('push data to tmpData, length:'+this.tmpData.length);
        return false;
    } else {
//        this.response.writeHead(200, {'Content-Type':'application/json'});
//        this.response.end(this.jsonpCallback + '(' + JSON.stringify(json) + ')');
        console.log('send data, connectionId:'+this.connectionId+", set tmpData to []");

        try{
            this.response.jsonpCallback(json);
        }catch (ex){

        }
        this.tmpData=[];
        this.redisTmpArray.clear();
        this.alive = false;
        return true;
    }
    return false;
};

Connection.prototype.refreshTimestamp=function(){
    this.timestamp=common.getUnixTimestamp();
}

Connection.prototype.clearTmpData=function(){
    this.tmpData=[];
    this.redisTmpArray.clear();
}
function ConnectionPool() {
    this.userConnPool = {};
    this.autoClean();
}

/**
 * 向连接池添加连接
 * 如果不存在该connectionId的连接，则添加，并且返回true
 * 如果已经存在该connectionId的活动连接，则抛出异常
 * 如果该连接是一个死连接，并且其临时数据区存在数据，则将数据返回，设置新的timestamp，并且返回false
 * 如果该连接是一个死连接，并且其临时数据区不存在数据，则设置新的变量，并且返回true
 * @param conn
 * @return {boolean} 返回false说明不需要做后续操作了
 */
ConnectionPool.prototype.add = function (conn) {
    if (conn instanceof Connection) {
        if (this.userConnPool[conn.sessionId] === undefined) {
            this.userConnPool[conn.sessionId] = {}
        }
        //如果连接池中不存在该id的连接
        if (this.userConnPool[conn.sessionId][conn.connectionId] === undefined) {
            this.userConnPool[conn.sessionId][conn.connectionId] = conn;
            redisClient.sadd('npeasy:');
            console.log('establish new connection')
        } else {//如果原来就存在这个id的连接
            var oldConn = this.userConnPool[conn.sessionId][conn.connectionId];
            console.log('connection existed, current tmpdata length '+ oldConn.tmpData.length)
            if (oldConn.alive) {//如果存在一个alive的连接在连接池中，说明本连接可能是伪造的，所以抛出异常
                throw new ConnectionException();

            } else if (oldConn.tmpData.length !== 0) { //如果目前有临时数据，则把临时数据传回，并且返回false
                conn.sendCrossSiteJson(oldConn.tmpData);
                oldConn.alive=false;
                oldConn.clearTmpData();
                console.log('clear tmp data')
                oldConn.refreshTimestamp();
                return false;
            } else {
                var newConn = this.userConnPool[conn.sessionId][conn.connectionId] = conn;
                newConn.alive = true;
                newConn.clearTmpData();
                newConn.refreshTimestamp();
            }

        }
        return true;
    }else{
        throw new ConnectionException();
    }
}
/**
 * 通过sessionId和connectionId获取对应的连接
 * @param sessionId
 * @param connectionId
 * @return {*}
 */
ConnectionPool.prototype.getConnection=function(sessionId,connectionId){
    if (this.userConnPool[sessionId] !== undefined && this.userConnPool[sessionId][connectionId] instanceof Connection) {
        return this.userConnPool[sessionId][connectionId];
    }else{
        return undefined;
    }
}
/**
 * 向制定连接推送数据，如果连接不存在，抛出异常
 * @param sessionId
 * @param connectionId
 * @param json
 */
ConnectionPool.prototype.send = function (sessionId, connectionId, json) {
    var conn=this.getConnection(sessionId,connectionId);
    console.log(conn.connectionId)
    if (conn!==undefined) {
        return conn.sendCrossSiteJson(json);
    }else{
        throw new ConnectionException();
    }
}
/**
 * 隔一段时间就对连接池进行清理，以免连接残留得不到清理，造成内存泄露
 */
ConnectionPool.prototype.autoClean = function () {
    var connPool = this.userConnPool;
    //每隔一段时间进行清理
    setInterval(function () {
        var currentTime=common.getUnixTimestamp();//获取当前时间
        for (var i in connPool) {
            if (connPool.hasOwnProperty(i)) {//对于每个session的所有连接
                if (Object.keys(connPool[i]).length !== 0) {
                    for (var j in connPool[i]) {
                        if (connPool[i].hasOwnProperty(j) && connPool[i][j] instanceof Connection) {//对于每个连接
                            if (currentTime - connPool[i][j].timestamp > 30000) {//如果离上次监听的时间过长
                                if(!connPool[i][j].sendCrossSiteJson({event:null, data:{}})){//发回空数据
                                    delete connPool[i][j];//如果该连接本来就是死的，则删除该连接
                                    console.log('clean pool');
                                }
                            }
                        }
                    }
                }
                if(Object.keys(connPool[i]).length==0) { //如果某个session的所有连接都被清理掉了，则把这个session连接容器也清理掉
                    delete connPool[i];
                }
            }
        }
    }, common.getTimeoutMSeconds());
}

exports.Connection = Connection;
exports.connectionPool = new ConnectionPool();
exports.ConnectionException = ConnectionException;