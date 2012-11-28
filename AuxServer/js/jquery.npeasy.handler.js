/**
 * Created with JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-28
 * Time: AM12:51
 * To change this template use File | Settings | File Templates.
 */

$(function () {
    $.npeasy('register', 'chat', function (data) {
        $('body').append(data)
    })
    $.npeasy('register','broadcast',function(data){
        $('body').append("<p style='color:red'>"+data+"</p>")
    })
})
