/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path');
var oauth=require('./oauth');
var app = express();
var RedisStore = require('connect-redis')(express);
var common=require('./common');
var json2 = require('./json2').JSON;

var Connection = require('./connection').Connection;
var connPool = require('./connection').connectionPool;

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
        secret: "my secret",
        store: new RedisStore({prefix:'NPEASY_SESSID:'})
    }));
    app.use(function (req, res, next) {
        res.jsonpCallback = function (json) {
            try {
                json2.stringify(json)
            } catch (ex) {
                json = {data:json}
            }
            res.writeHead(200, {'Content-Type':'application/json'});
            res.end(req.query.callback + '(' + json2.stringify(json) + ')');
        }
        next();
    });
    app.use(express.session());
    app.use(app.router);
    app.use('/public', express.static(path.join(__dirname, '/public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});
/**
 * 在没有登录的情况下，
 * 在已登录的情况下，建立连接时，会在redis中插入一项
 * 登录和未登录如何区别？
 * 登录状态下，npeasy:cookie:<cookie_val>:user_info_raw是有值的
 * @param req
 * @param res
 * @param next
 */
function establishCometConnectionMiddleWare(req, res, next) {
    var sessionId = req.cookies['npeasy.sid'];
    var connectionId = req.param('connectionId');
    try {
        if (sessionId !== undefined && connectionId !== undefined && connPool.add(new Connection(req, res, sessionId, connectionId))) {
            req.sessionId = sessionId;
            req.connectionId = connectionId;
            next();
        } else {
            console.log('Comet connection middle ware, initialize sessionId and connectionId failed: sessionId ' + sessionId + " connectionId: " + connectionId);
            if (sessionId === undefined) {
                res.jsonpCallback({event:'noSessionId', data:{}})
            } else if (connectionId === undefined) {
                res.jsonpCallback({event:'noConnectionId', data:{}})
            }
        }
    } catch (ex) {
        console.log('Cannot add this connection sessionId: ' + sessionId + " connectionId: " + connectionId + " . Because its id has already exist in connection pool.");
    }
}
app.get('/', routes.index);

app.all('/user/id',function(req,res){
    oauth.getUserId(req,res,function(uid){
        res.jsonpCallback(uid);
    })
})
//最开始，如果不是登录用户，则这个方法不能完成任何事情
app.all('/oauth/confirm-identity',function(req,res){
    oauth.redirectToGetAuthCode(req,res);
})
app.all('/oauth/callback',function(req,res){
    oauth.callback(req,res);
})

app.all('/listen',function(req,res){

})
http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
