/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-10
 * Time: 下午4:13
 * To change this template use File | Settings | File Templates.
 */

/**
 * 建立和npeasy的长连接
 * 每隔一段时间看看上一次的请求有没有返回，如果好久都没有反应，则再次连接
 * 在同一时间里，只能存在一个向npeasy的listen连接
 */
(function ($) {
    var port = 3000;
    var domain = 'http://npeasy.com';
    var event_handlers = {};
    var channel_event_handlers = {};
    var connectionId = Math.random();
    var listenConnectionChecker = false;
    var listenLastResponseTimestamp = new Date() * 1;

    /**
     * 限制在同一时间内只有一个Listener
     * @constructor
     */
    function ListenerCriticalArea() {
        this.listenerNumber = 0;
    }

    ListenerCriticalArea.prototype.get = function () {
        if (this.listenerNumber >= 1) {
            return false;
        } else {
            return true;
        }
    }
    ListenerCriticalArea.prototype.release = function () {
        if (this.listenerNumber >= 1) {
            this.listenerNumber=0;
        }
    }
    var listenerCriticalArea = new ListenerCriticalArea();
    var class_methods = {
            getTimestamp:function () {
                return new Date() * 1;
            },
            init:function (option) {
            },
            setup:function (option) {
                if ('port' in option)
                    port = option.port;
                if ('domain' in option)
                    domain = option.domain;
            },
            connect:function (dest, callback) {
                var request = $.ajax({
                    //async : false, //使用同步请求
                    type:'GET',
                    url:domain + ':' + port + '/' + dest + '?connectionId=' + connectionId,
                    dataType:'jsonp', //选择返回值类型
                    jsonp:"callback", //规定发送/接收参数，默认为callback
                    timeout:300000,
                    error:function (XHR, textStatus, errorThrown) {

                    },
                    success:callback
                });

                return request;
            },

            listen:function () {
                if (!listenerCriticalArea.get()) {
                    return;
                }
                function handleDataObject(data) {
                    var handlers = event_handlers[data.event];
                    if (handlers != undefined && handlers instanceof Array) {
                        for (var i = 0; i < handlers.length; ++i) {
                            handlers[i](data.data);
                        }
                    }
                }

                function handler(data) {
                    listenLastResponseTimestamp = $.npeasy('getTimestamp');
                    listenerCriticalArea.release();
                    //重新建立连接
                    $.npeasy('listen');
                    //刷新时间戳
                    if (data instanceof Array) {
                        for (var j in data) {
                            handleDataObject(data[j]);
                        }
                    } else {
                        handleDataObject(data);
                    }

                }

                //保证只有一个interval被设置
                if (!listenConnectionChecker) {
                    listenConnectionChecker = true;
                    setInterval(function () {//如果过了60秒还是没有响应，则重新连接
                        if ($.npeasy('getTimestamp') - listenLastResponseTimestamp > 60000) {
                            listenerCriticalArea.release();
                            $.npeasy('listen');
                        }
                    }, 31000);
                }


                $.npeasy('connect', 'listen', handler);
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
$(function () {
    $('.testArea').html("<iframe src='http://npeasy.com:3000/oauth/confirm-identity' style='display: none;'></iframe>");
    setTimeout(function () {
        $.npeasy('listen')
    }, 100)
})
var npeasy = $.npeasy;
jQuery = $ = window.parent.$;
$.npeasy = npeasy;