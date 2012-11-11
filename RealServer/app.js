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

var json2 = require('./json2').JSON;
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

app.get('/', routes.index);

app.all('/user/id',function(req,res){
    oauth.getUserId(req,res,function(uid){
        res.jsonpCallback(uid);
    })
})
app.all('/oauth/confirm-identity',function(req,res){
    oauth.redirectToGetAuthCode(req,res);
})
app.all('/oauth/callback',function(req,res){
    oauth.callback(req,res);
})
http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
