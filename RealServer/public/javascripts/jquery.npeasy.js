/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-10
 * Time: 下午4:13
 * To change this template use File | Settings | File Templates.
 */
(function ($) {
    var port = 3000;
    var domain = 'http://npeasy.com';
    var event_handlers = {};
    var channel_event_handlers = {};
    var connectionId=Math.random();
    var class_methods = {
            init:function (option) {
            },
            setup:function (option) {
                if ('port' in option)
                    port = option.port;
                if ('domain' in option)
                    domain = option.domain;
            },
            connect:function (dest, callback, timeout_callback) {
                return $.ajax({
                    //async : false, //使用同步请求
                    type:'GET',
                    url:domain + ':' + port + '/' + dest+'?connectionId='+connectionId,
                    dataType:'jsonp', //选择返回值类型
                    jsonp:"callback", //规定发送/接收参数，默认为callback
                    timeout:30000,
                    error:function (jqXHR, textStatus, errorThrown) {
                        if (textStatus == "timeout") {
                            if (typeof timeout_callback == 'function') {
                                timeout_callback();
                            }
                            //alert('抱歉！请求超时，请重试！或请检查您的网络状况！');
                            return false;
                        } else if (textStatus == "error" || textStatus == "parsererror") {
                            //alert('抱歉！系统发生错误，请重试！');
                            return false;
                        } else if (textStatus == "abort") {
                            //alert('抱歉！程序发生中断，请重试！');
                            return false;
                        }
                    },
                    success:callback
                });
            },

            listen:function () {
                function handleDataObject(data){
                    var handlers=event_handlers[data.event];
                    if (handlers != undefined && handlers instanceof Array) {
                        for (var i = 0; i < handlers.length; ++i) {
                            handlers[i](data.data);
                        }
                    }
                }
                function handler(data) {
                    if (data instanceof Array){
                        for(var j in data){
                            if(data[j].event=='connectionExists'){
                                return;
                            }
                            handleDataObject(data[j]);
                        }
                        $.npeasy('listen');
                    }else{
                        //如果是已存在connection 则停止listen
                        if(data.event=='connectionExists'){
                            return;
                        }
                        $.npeasy('listen');
                        handleDataObject(data);
                    }

                }

                a = $.npeasy('connect', 'listen', handler, function () {
                    $.npeasy('listen');
                });
            },
            subscribe:function (channelName) {
                function channelHandleDataObject(data) {
                    if (channel_event_handlers[channelName] !== undefined && channel_event_handlers[channelName][data.event] !== undefined && channel_event_handlers[channelName][data.event] instanceof Array) {
                        var handlers = channel_event_handlers[channelName][data.event];
                        for (var i = 0; i < handlers.length; ++i) {
                            handlers[i](data.data);
                        }
                    }
                }

                function handler(data) {

                    $.npeasy('subscribe', channelName);
                    if (data instanceof Array) {
                        for (var i = 0; i < data.length; ++i) {
                            channelHandleDataObject(data[i]);
                        }
                    } else {
                        channelHandleDataObject(data);
                    }

                }

                $.npeasy('connect', 'subscribe/' + channelName, handler, function () {
                    $.npeasy('subscribe', channelName);
                })
            },
            register:function (param1, param2, param3) {
                if (arguments.length == 2) {
                    var event_name = param1,
                        handler = param2;
                    if (event_handlers[event_name] == undefined) {
                        event_handlers[event_name] = [];
                    }
                    event_handlers[event_name].push(handler);
                } else if (arguments.length == 3) {
                    var channel_name = param1,
                        event_name = param2,
                        handler = param3;
                    if (channel_event_handlers[channel_name] == undefined) {
                        channel_event_handlers[channel_name] = {};
                    }
                    if (channel_event_handlers[channel_name][event_name] == undefined) {
                        channel_event_handlers[channel_name][event_name] = [];
                    }
                    channel_event_handlers[channel_name][event_name].push(handler);
                }
            },
            sendMsg:function (toUserId, content) {
                $.npeasy('connect', 'chat?touserid=' + toUserId + '&msg=' + content);
            },
            getUserList:function (handler) {
                $.npeasy('connect', 'getUserList', handler);
            }
        }
        ;
    $.npeasy = function (method) {
        if (class_methods[method]) {
            return class_methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return class_methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.simuUi');
        }
    };

})(jQuery);
$(function(){
    $('.testArea').html("<iframe src='http://npeasy.com:3000/oauth/confirm-identity' ></iframe>")
})

$.npeasy('register','dummy',function(res){
    console.log(res);
})
$.npeasy('register','chat',function(res){
    console.log(res);
})
$.npeasy('listen');