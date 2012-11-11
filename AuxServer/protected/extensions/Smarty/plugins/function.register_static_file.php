<?php

function smarty_function_register_static_file($params, $template)
{
    $is_global=empty($params['is_global'])?false:$params['is_global'];
    $module_name=empty($params['module_name'])?null:$params['module_name'];
    Common::register($params['file'],$is_global,$module_name);
}