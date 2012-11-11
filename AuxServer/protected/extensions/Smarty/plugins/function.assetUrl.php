<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Administrator
 * Date: 12-10-5
 * Time: 下午4:56
 * To change this template use File | Settings | File Templates.
 */
function smarty_function_assetUrl($params, $template) {
    $file = isset($params['file']) ? $params['file'] : 'default';
    $module_id = null;
    if(!isset($params['global']))
    {
        $module = Yii::app()->controller->module;
        if(!empty($module))
        {
            $module_id = $module->id;
        }
    }
    else
    {
        $module_id = null;
    }

    if(Common::endsWith($file, 'js'))
    {
        $file_type = 'js';
    }
    else if(Common::endsWith($file, 'css'))
    {
        $file_type = 'css';
    }
    else
    {
        $file_type = 'images';
    }

    if ($module_id === NULL)
    {
        $url = Yii::app()->assetManager->publish(
            Yii::getPathOfAlias('application') . '/../' . $file_type,false,-1,true);
    } else
    {
        $url = Yii::app()->assetManager->publish(
            Yii::getPathOfAlias('application.modules.' . $module_id . '.assets.' . $file_type),false,-1,true);
    }
    $path = $url.'/'.$file;
    if($file_type == 'js')
    {
        return $path;
    }
    else if($file_type == 'css')
    {
        return $path;
    }
    else
    {
        return $path;
    }
}