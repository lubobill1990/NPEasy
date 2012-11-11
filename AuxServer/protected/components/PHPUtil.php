<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Administrator
 * Date: 12-9-24
 * Time: 下午6:23
 * To change this template use File | Settings | File Templates.
 */

function error_handler()
{
    throw new Exception("Error");
}

class PHPUtil
{
    public static function imagecreatefrom($filepath)
    {
        set_error_handler("error_handler");
        $types = array(
            'jpeg', 'png', 'bmp', 'gif',
        );
        foreach ($types as $type) {
            try {
                switch ($type) {
                    case 'jpeg':
                        {
                        $img = imagecreatefromjpeg($filepath);
                        }
                        break;
                    case 'png':
                        {
                        $img = imagecreatefrompng($filepath);
                        }
                        break;
                    case 'bmp':
                        {
                        $img = imagecreatefromwbmp($filepath);
                        }
                        break;
                    case 'gif':
                        {
                        $img = imagecreatefromgif($filepath);
                        }
                        break;
                    default:
                        {
                        throw new Exception("正常情况不会发生的问题");
                        }
                }
            } catch (Exception $e) {
                continue;
            }
            return $img;
        }
        throw new Exception("文件破损或不支持的文件类型！");
    }
}
