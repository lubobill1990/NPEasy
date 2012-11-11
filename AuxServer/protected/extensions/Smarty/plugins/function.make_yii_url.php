<?php
function smarty_function_make_yii_url($params, $template){
    if(array_key_exists('route',$params)){
        $route=$params['route'];
        unset($params['route']);
        $argument=array($route);
        foreach($params as $key=>$val){
            $argument[$key]=$val;
        }
        return CHtml::normalizeUrl($argument);
    }else{
        throw new Exception('You should give the route path');
    }
}
