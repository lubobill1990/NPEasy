<?php
function smarty_function_make_yii_link($params,$template){
    if(array_key_exists('route',$params)){
        $route = $params['route'];
        $r_first = true;
        $class = "";
        $name = "";
        foreach($params as $key=>$p) {
            if($key=='class') {
                $class = " class=".$p;
            } else if($key == 'name') {
                $name = $p;
            } else if($key != 'route') {
                if($r_first) {
                    $route.= "?".$key."=".$p;
                    $r_first = false;
                } else {
                    $route.="&".$key."=".$p;
                }
            }
        }
        $str = "<a href='$route' $class>$name</a>";
        return $str;
    }else{
        throw new Exception('route not given');
    }
}