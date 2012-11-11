<?php
/**
 * Created by JetBrains PhpStorm.
 * User: bolu
 * Date: 12-9-26
 * Time: 下午5:28
 * To change this template use File | Settings | File Templates.
 */
function smarty_function_interval($params, $template) {
    $time=strtotime($params['date']);
    return Common::getIntervalTimeTillNow($time);
}