/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-11
 * Time: 下午6:00
 * To change this template use File | Settings | File Templates.
 */
/**
 * 去除多余空格函数
 * dtrim:去除两边空格 lTrim:去除左空格 rTrim: 去除右空格
 * 用法：
 *     var str = "  hello ";
 *     str = str.dtrim();
 */
String.prototype.dtrim = function () {
    return this.replace(/(^[\\s]*)|([\\s]*$)/g, "");
};
String.prototype.ltrim = function () {
    return this.replace(/(^[\\s]*)/g, "");
};
String.prototype.rtrim = function () {
    return this.replace(/([\\s]*$)/g, "");
};
Array.prototype.remove = function (dx) {
    if (isNaN(dx) || dx > this.length) {
        return false;
    }
    return this.splice(dx, 1)[0];
};


var crypto = require('crypto');
exports.postSecret="5199DED1ECBBF664AD4376306FD45F19";
exports.getUnixTimestamp = function getUnixTimestamp() {
    return new Date() * 1;
};
var requestTimeout = 30000;
//generate an id of current node
var random_string=(""+Math.random());
exports.nodeId=random_string.slice(2,random_string.length-1);

exports.getTimeoutMSeconds = function getTimeoutMSeconds() {
    return requestTimeout;
};
exports.composeMd5Id=function composeMd5Id(sessionId,connectionId){
    return crypto.createHash('md5').update(sessionId+''+connectionId).digest("hex");
}
