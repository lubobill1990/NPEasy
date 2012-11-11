<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Administrator
 * Date: 12-9-12
 * Time: 下午2:38
 * To change this template use File | Settings | File Templates.
 */

public
function smarty_function_vardump($params, $template)
{
    if (!isset($params['val'])) {
        return;
    }
    $val = $params['val'];
    return var_dump($val);
}