/**
 * npeasy
 * - cookie:cookie_value
 * |- connection:connection_value
 * - user:user_id
 * |- cookie:cookie_value
 * @type {*}
 */
var redis = require('redis'),
    redis_client = redis.createClient();
var http=require('http');
var json2=require('./json2').JSON;

exports.getUserId=function(req,res,callback){
    var redis_prefix='npeasy:cookie:'+req.cookies['npeasy.sid'];
    redis_client.get(redis_prefix+':user_info_raw',function(err,data){
        if(err){
            //if such a key does not exist, return zero 0
            callback(0);
        }else{
            //if exists such a key,then the res is the user_id
            try{
                var user_info=json2.parse(data);
                callback(user_info.id);
            }catch(ex){
                callback(0);
            }
        }
    })
}

exports.redirectToGetAuthCode=function(req,res){
    res.writeHead(302, {
        'Location': 'http://npeasy.com:13050/oAuth/getAuthorizedCode?app_key=1111'
    });
    res.end();
}
exports.callback=function(req,res){
    var redis_prefix='npeasy:cookie:'+req.cookies['npeasy.sid'];
    var request_access_token=http.request({
        host:'npeasy.com',
        port:13050,
        path:'/oAuth/getAccessToken?auth_code='+req.param('auth_code')+'&app_key=1111&app_secret=1111',
        method:'GET'
    },function(access_token_response){
        var access_token='';
        access_token_response.on('data',function(chunk){
            access_token+=chunk;
        })
        access_token_response.on('end',function(){
            redis_client.set(redis_prefix+':access_token',access_token);
            var user_info_request=http.request({
                host:'npeasy.com',
                port:13050,
                path:'/oAuth/getUserInfo?access_token='+access_token,
                method:'GET'
            },function(user_info_response){
                var user_info_raw='';
                user_info_response.on('data',function(data){
                    user_info_raw+=data;
                })
                user_info_response.on('end',function(){
                    if(user_info_raw.length==0){
                        return;
                    }
                    try{
                        var user_info=json2.parse(user_info_raw);
                        redis_client.set(redis_prefix+':user_info_raw',user_info_raw);
                    }catch (ex){
                        console.log("json parse failed: "+user_info_raw)
                    }
                    res.send(user_info_raw);
                })
            })
            user_info_request.end();
        })
    })
    request_access_token.end();

}