<?php
/**
 * Created by JetBrains PhpStorm.
 * User: bolu
 * Date: 12-10-11
 * Time: 上午3:39
 * To change this template use File | Settings | File Templates.
 */
function smarty_function_split_by_dot($params, $template) {
    $src=is_string($params['src'])&&!empty($params['src'])?$params['src']:"";
    $arr=preg_split('/[,\s]+/',$src);
    $coma="";
    $res="";
    foreach($arr as $val){
        $res.=$coma.$val;
        $coma=' • ';
    }
    echo $res;
}