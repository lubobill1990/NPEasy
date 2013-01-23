/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-29
 * Time: AM1:41
 * To change this template use File | Settings | File Templates.
 */
connection = require('../lib/Connection');
userPool = require('../lib/UserPool').userPool;
connPool = require('../lib/ConnectionPool').connectionPool;
common = require('../common');
_ = common._;

function sendDataToUser(userId, event, data) {
    var userConnectionPool = userPool.getUserConnectionPool(userId);
    if (userConnectionPool == undefined) {
        console.log('user not exist')
        return false;
    }
    connection.sendCrossSiteJson(userConnectionPool.getConnections(), {
        event:event,
        data:data});
}
function sendDataToUsers(userIdArray, event, data) {
    var userConnectionPool = _.reduce(userIdArray, function (memo, userId) {
        return memo.concat(userPool.getUserConnectionPool(userId))
    }, [])

    connection.sendCrossSiteJson(userConnectionPool.getConnections(), {
        event:event,
        data:data});
}

function broadcast(event, data) {
    var c_p = connPool.getConnections();
    for (var i in c_p) {
        if (c_p.hasOwnProperty(i)) {//对于每个session的所有连接
            for (var j in c_p[i]) {
                c_p[i][j].sendCrossSiteJson({
                    event:event,
                    data:data});
            }
        }
    }
}

exports.broadcast = function (req, res) {
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

/**
 * req中需要有以下变量
 * fromUserId
 * touserId
 * content
 * timestamp
 * @param req
 * @param res
 */
exports.chat = function (req, res) {
    var userId = req.param('toUserId');
    var fromUserId = req.param('fromUserId');
    var userConnectionPool = userPool.getUserConnectionPool(userId);
    if (userConnectionPool == undefined) {
        console.log('user not exist')
        res.send('user not exist')
        return;
    }
    connection.sendCrossSiteJson(userConnectionPool.getConnections(),
        {event:'chat',
            data:{
                from_user_id:fromUserId,
                user_id:userId,
                timestamp:req.param('timestamp'),
                content:req.param('content')}});
    res.send('success');
}

/**
 * 如果给一个数组，则将数据传到数组id表示的所有用户
 * 如果给一个数字，则将数据传到ID表示的用户
 * userId|userIdArray
 *
 * @param req
 * @param res
 */
exports.remind = function (req, res) {
    var userId = req.param('userId');
    var userIdArray = req.param('userIdArray');
    if (userIdArray != undefined) {
        sendDataToUsers(userIdArray, 'remind', "")
    } else if (userId != undefined) {
        sendDataToUser(userId, 'remind', "")
    } else {
        res.send('missing param')
    }
    res.send('success')
}

/**
 *
 */

exports.notice = function (req, res) {
    broadcast('notice', req.content);
    res.send('success')
}