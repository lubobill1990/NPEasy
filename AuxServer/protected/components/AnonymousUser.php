<?php
class AnonymousUser extends CComponent{
    function getName(){
        return '匿名';
    }

    function getId(){
        return 0;
    }
    function getAlias_name(){
        return '匿名';
    }

    function getAvatar_url(){
        return '/images/common/noavatar.png';
    }
}

?>