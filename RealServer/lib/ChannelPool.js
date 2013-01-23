/**
 * Created with JetBrains WebStorm.
 * User: bolu
 * Date: 12-12-2
 * Time: PM5:27
 * To change this template use File | Settings | File Templates.
 */

/**
 * 这个对象中存入了所有channel的集合，可以通过这个对象获取所有这个channel的connection
 * @constructor
 */
function ChannelPool(){
    this.channels={}
}
exports.channelPool=new ChannelPool();
ChannelPool.prototype.getChannelConnectionPool=function(channelName){

}