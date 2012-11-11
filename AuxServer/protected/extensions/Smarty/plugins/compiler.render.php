<?php
/**
 * Created by JetBrains PhpStorm.
 * User: abraham
 * Date: 12-9-9
 * Time: 下午4:50
 * To change this template use File | Settings | File Templates.
 */
function smarty_compiler_render($params, Smarty $smarty){
    $str = 'array(';
    foreach($params as $key=>$p) {
        if($key=="file") {
            $file = $p;
        } elseif($key=="pointer") {
            $pointer = $p;
        } else {
            $str.= "'$key'=>".$p.",";
        }
    }
    $str.= ")";
    $phpcode="<?php ".$pointer."->renderPartial($file, $str);?>";

    return $phpcode;
}