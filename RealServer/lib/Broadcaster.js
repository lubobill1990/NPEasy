/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-28
 * Time: 晚上11:00
 * To change this template use File | Settings | File Templates.
 */

var events = require('events');
var util = require('util');

function Broadcaster() {
    events.EventEmitter.call(this);
}
var common = require('../common');
var redisClient = common.redisClient;
var JSON = common.JSON;
var _ = require('underscore');

var connectionPool1 = require('./ConnectionPool').connectionPool;

util.inherits(Broadcaster, events.EventEmitter);
broadcaster = new Broadcaster();
broadcaster.addListener('logout', function (userId) {
    console.log(userId + " logout")
});
broadcaster.addListener('online', function (userId) {
    console.log(userId + " online")
    var c_p = connectionPool1.getConnections();
    for (var i in c_p) {
        if (c_p.hasOwnProperty(i)) {//对于每个session的所有连接
            for (var j in c_p[i]) {
                c_p[i][j].sendCrossSiteJson({'event':'login', data:{b:123}});
            }
        }
    }
})

exports.broadcaster = broadcaster;