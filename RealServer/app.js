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
var json2 = require('./json2').JSON;
var connection=require('./connection'),
    Connection =connection.Connection,
    connPool = connection.connectionPool,
    userPool=connection.userPool;
var midware = require('./middleware');

app.configure(function () {
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

app.all('/listen', midware.establishCometConnectionMiddleWare, function (req, res) {

})

app.all('/broadcast', function (req, res) {
    var c_p = connPool.getConnections();
    for (var i in c_p) {
        if (c_p.hasOwnProperty(i)) {//对于每个session的所有连接
            for (var j in c_p[i]) {
                c_p[i][j].sendCrossSiteJson({'event':'broadcast',data:{b:123}});
            }
        }
    }
    res.send('adf');
});
app.all('/chat',function(req,res){
    var userId=req.param('userId');
    var userConnection=_.map(userPool.getUserConnectionPool(userId).getConnections(),function(val,key){return val;});
    console.log(userConnection)
    connection.sendCrossSiteJson(userConnection,{event:'chat',data:"hello"});
    res.send('success');
})
http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
