<?php
/**
 * Created by JetBrains PhpStorm.
 * User: bolu
 * Date: 12-10-16
 * Time: 下午12:48
 * To change this template use File | Settings | File Templates.
 */
Yii::import('ext.feedback.DiggProxy');

function smarty_function_digg($params, $template){
    DiggProxy::register($params['subject_type'],$params['subject_id']);
    Yii::app()->executeBuffer->append(function($params){
        ob_end_flush();
        ob_start();
        echo DiggProxy::getHtml($params['subject_type'],$params['subject_id']);
        $str=ob_get_contents();
        ob_clean();
        return $str;
    },$params);

}