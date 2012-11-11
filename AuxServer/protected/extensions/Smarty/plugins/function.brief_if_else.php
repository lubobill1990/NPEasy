<?php
function smarty_function_brief_if_else($params, $template){
    if($params['s']==$params['t']){
        return $params['e'];
    }else{
        return $params['ne'];
    }
}
