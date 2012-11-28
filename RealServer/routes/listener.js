/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-29
 * Time: AM1:41
 * To change this template use File | Settings | File Templates.
 */
exports.listen=function(req,res){

}
exports.refreshConnection=function(req,res){
    try{
        var connection=connPool.getConnections()[req.sessionId][req.connectionId]
        connection.sendCrossSiteJson(common.dummyMessage);
    }catch(ex){
        console.log(ex.toString());
    }
}
exports.subscribe=function(req,res){

}
exports.unsubscribe=function(req,res){

}