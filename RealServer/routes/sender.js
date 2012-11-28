/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-29
 * Time: AM1:41
 * To change this template use File | Settings | File Templates.
 */
connection=require('../lib/Connection');
userPool=require('../lib/UserPool').userPool;
connPool=require('../lib/ConnectionPool').connectionPool;
common=require('../common');
_=common._;


exports.broadcast=function (req, res) {
    var c_p = connPool.getConnections();
    for (var i in c_p) {
        if (c_p.hasOwnProperty(i)) {//对于每个session的所有连接
            for (var j in c_p[i]) {
                c_p[i][j].sendCrossSiteJson({'event':'broadcast', data:{b:123}});
            }
        }
    }
    res.send('success');
}

exports.chat=function (req, res) {
    var userId = req.param('userId');
    var userConnectionPool=userPool.getUserConnectionPool(userId);
    if(userConnectionPool==undefined){
        res.send('user not exist')
        return;
    }
    var userConnection = _.map(userConnectionPool.getConnections(), function (val, key) {
        return val;
    });
    //console.log(userConnection)
    connection.sendCrossSiteJson(userConnection, {event:'chat', data:"hello"});
    res.send('success');
}