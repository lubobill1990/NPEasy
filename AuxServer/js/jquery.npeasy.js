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
    var event_handlers = {};//处理listen获取事件的handler
    var connectionId = Math.random();
    var listenLastResponseTimestamp = new Date() * 1;
    var listenTimeoutHandler;
    var connectionNumber = 0;
    var listenerNumber = 0;
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
                connectionNumber++;
                console.log(connectionNumber)
                var request = $.ajax({
                    //async : false, //使用同步请求
                    type:'GET',
                    url:domain + ':' + port + '/' + dest + '?connectionId=' + connectionId,
                    dataType:'jsonp', //选择返回值类型
                    jsonp:"callback", //规定发送/接收参数，默认为callback
                    timeout:300000,
                    error:function (XHR, textStatus, errorThrown) {

                    },
                    success:function (data) {
                        connectionNumber--;
                        if(callback!=undefined&&typeof(callback)=='function' ){
                            callback(data);
                        }
                    }
                });

                return request;
            },
            listen:function () {//每次建立连接时，设置一个超时处理函数，如果到了一定的时间没有响应，则重新建立连接
                if (listenerNumber >= 1) {
                    return;
                }
                listenerNumber++;

                function handleDataObject(data) {//事件数据处理函数
                    var handlers = event_handlers[data.event];
                    if (handlers != undefined && handlers instanceof Array) {
                        for (var i = 0; i < handlers.length; ++i) {
                            handlers[i](data.data);
                        }
                    }
                }

                function handler(data) {
                    // clearTimeout(listenTimeoutHandler);
                    listenerNumber = 0;
                    if (data.event == 'connectionExists'||data.event=='refreshConnection') {
                        return;
                    }
                    listenLastResponseTimestamp = $.npeasy('getTimestamp');
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

                //超出100秒后重连
                listenTimeoutHandler=setTimeout(function(){
                    clearTimeout(listenTimeoutHandler);
                    $.npeasy('connect','refreshConnection',function(data){
                        listenerNumber=0;
                        $.npeasy('listen');
                    });
                },5000)

                $.npeasy('connect', 'listen', handler);
            },

            register:function (param1, param2, param3) {
                if (arguments.length == 2) {
                    var event_name = param1,
                        handler = param2;
                    if (event_handlers[event_name] == undefined) {
                        event_handlers[event_name] = [];
                    }
                    event_handlers[event_name].push(handler);
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