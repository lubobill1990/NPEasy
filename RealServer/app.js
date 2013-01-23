/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path');
var oauth = require('./oauth');
var app = express();
var RedisStore = require('connect-redis')(express);
var common = require('./common');
var json2 = common.JSON;
var sio = require('socket.io');
var connection = require('./lib/Connection');
var Connection = connection.Connection;
var _ = common._;
var midware = require('./middleware');
var redisStore = new RedisStore({prefix:'NPEASY_SESSID:'});
var listenerRoutes = require('./routes/listener');
var senderRoutes = require('./routes/sender');
app.configure('all', function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session({
        key:'npeasy.sid',
        secret:"my secret",
        store:redisStore
    }));
    app.use(midware.addJsonpCallbackFunction);
    app.use(express.session());
    app.use(app.router);
    app.use('/public', express.static(path.join(__dirname, '/public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/test', midware.checkSenderPermission, routes.chat);

app.all('/user/id', function (req, res) {
    oauth.getUserId(req, res, function (uid) {
        res.jsonpCallback(uid);
    })
})
//最开始，如果不是登录用户，则这个方法不能完成任何事情
app.all('/oauth/confirm-identity', function (req, res) {
    oauth.redirectToGetAuthCode(req, res);
})
app.all('/oauth/callback', function (req, res) {
    oauth.callback(req, res);
})
app.all('/listen',
    midware.filterConnection, //过滤缺少参数的连接
    midware.addConnectionToPool, //将连接放到连接池
    midware.addConnectionToUserPool, //如果连接是属于某个用户的，则将该连接放入该用户的连接池
    listenerRoutes.listen);

/**
 * 当浏览器需要重建连接
 */
app.all('/refreshConnection', midware.filterConnection, listenerRoutes.refreshConnection);

app.all('/subscribe', midware.filterConnection, listenerRoutes.subscribe);

app.all('/unsubscribe', midware.filterConnection, listenerRoutes.unsubscribe);

app.all('/userList', midware.filterConnection, listenerRoutes.getUserList);

app.all('/broadcast', midware.checkSenderPermission, senderRoutes.broadcast);

app.all('/chat', midware.checkSenderPermission, senderRoutes.chat);

app.all('/remind', midware.checkSenderPermission, senderRoutes.remind);

app.all('/notice', midware.checkSenderPermission, senderRoutes.notice);

server = http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
//
//parseCookie = require('./node_modules/express/node_modules/connect').utils.parseCookie;
//
//var io = sio.listen(server);
////io.set('authorization', function (handshakeData, callback) {
////    // 通过客户端的cookie字符串来获取其session数据
////    handshakeData.cookie = parseCookie(handshakeData.headers.cookie)
////    var connect_sid = handshakeData.cookie['npeasy.sid'];
////
////    if (connect_sid) {
////        redisStore.get(connect_sid, function (error, session) {
////            if (error) {
////                // if we cannot grab a session, turn down the connection
////                callback(error.message, false);
////            }
////            else {
////                // save the session data and accept the connection
////                handshakeData.session = session;
////                callback(null, true);
////            }
////        });
////    }
////    else {
////        callback('nosession');
////    }
////});
//io.sockets.on('connection', function (socket) {
//    setInterval(function () {
//        socket.emit('news', { hello:'world' });
//    }, 3000)
//    socket.on('listen', function (data) {
//        console.log(data);
//    });
//});