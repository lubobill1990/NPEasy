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

var connection = require('./lib/Connection');
var Connection = connection.Connection;
var _=common._;
var midware = require('./middleware');

var listenerRoutes=require('./routes/listener');
var senderRoutes=require('./routes/sender');
app.configure('all',function () {
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
        store:new RedisStore({prefix:'NPEASY_SESSID:'})
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
app.get('/test',midware.checkSenderPermission, routes.chat);

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
app.all('/listen', midware.filterConnection,midware.establishCometConnectionMiddleWare, listenerRoutes.listen);
/**
 * 当浏览器需要重建连接
 */
app.all('/refreshConnection',midware.filterConnection,listenerRoutes.refreshConnection);

app.all('/subscribe',midware.filterConnection,listenerRoutes.subscribe);

app.all('/unsubscribe',midware.filterConnection,listenerRoutes.unsubscribe);

app.all('/userList',midware.filterConnection,listenerRoutes.getUserList);

app.all('/broadcast', midware.checkSenderPermission,senderRoutes.broadcast);

app.all('/chat', midware.checkSenderPermission,senderRoutes.chat);

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
