$(function () {
    var npeasy=undefined;
    function getNpeasy(callback){
        try{
            npeasy = document.getElementById('comet').contentWindow.$.npeasy;
            callback();
        }catch(ex){
            setTimeout(function(){
                getNpeasy(callback);
            },500);
        }
    }
    getNpeasy(function(){
        $.npeasy=npeasy;
        $.npeasy('register', 'chat', function (data) {
            $('.testArea').append(data);
        })
    })



})