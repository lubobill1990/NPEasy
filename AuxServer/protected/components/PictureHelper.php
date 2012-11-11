<?php
class PictureHelper
{
    public static function  handleUpload($file, $params)
    {
        $base_path = $_SERVER['DOCUMENT_ROOT'] . '/';
        $host_url = $_SERVER['HTTP_HOST'] . '/';
        $base_url = substr($host_url, strpos($host_url, '/'));
        //文件保存目录路径
        $save_path = $base_path . Yii::app()->params['uploadDir'] . '/';
        //文件保存目录URL
        $save_url = $base_url . Yii::app()->params['uploadDir'] . '/';

        $result = array(); //返回值
        //定义允许上传的文件扩展名
        $ext_arr = array(
            'image' => array('jpg', 'jpeg', 'png', 'bmp'),
        );
        //最大文件大小
        $max_size = 1000000;

        //PHP上传失败
        if (!empty($file['error'])) {
            switch ($file['error']) {
                case '1':
                    $error = '超过php.ini允许的大小。';
                    break;
                case '2':
                    $error = '超过表单允许的大小。';
                    break;
                case '3':
                    $error = '图片只有部分被上传。';
                    break;
                case '4':
                    $error = '请选择图片。';
                    break;
                case '6':
                    $error = '找不到临时目录。';
                    break;
                case '7':
                    $error = '写文件到硬盘出错。';
                    break;
                case '8':
                    $error = 'File upload stopped by extension。';
                    break;
                case '999':
                default:
                    $error = '未知错误。';
            }
            $msg = $error;
            goto fail;
        }

        //有上传文件时
        if (empty($_FILES) === false) {
            //原文件名
            $file_name = $file['name'];
            $result['original_name'] = $file_name;
            if(isset($params['title']))
                $result['title'] = $params['title'];
            else $result['title'] = $file_name;
            if(isset($params['description']))
                $result['description']= $params['description'];

            //服务器上临时文件名
            $tmp_name = $file['tmp_name'];
            //文件大小
            $file_size = $file['size'];
            $result['raw_file_size'] = $file_size;
            //检查文件名
            if (!$file_name) {
                $msg = "请选择文件。";
                goto fail;
            }
            //检查目录
            if (@is_dir($save_path) === false) {
                $msg = "上传目录不存在。";
                goto fail;
            }
            //检查目录写权限
            if (@is_writable($save_path) === false) {
                $msg = "上传目录没有写权限。";
                goto fail;
            }
            //检查是否已上传
            if (@is_uploaded_file($tmp_name) === false) {
                $msg = "上传失败。";
                goto fail;
            }
            //检查文件大小
            if ($file_size > $max_size) {
                $msg = "上传文件大小超过限制。";
                goto fail;
            }
            //检查目录名
            $dir_name = empty($_GET['dir']) ? 'image' : trim($_GET['dir']);
            if (empty($ext_arr[$dir_name])) {
                $msg = "目录名不正确。";
                goto fail;
            }
            //获得文件扩展名
            $temp_arr = explode(".", $file_name);
            $file_ext = array_pop($temp_arr);
            $file_ext = trim($file_ext);
            $file_ext = strtolower($file_ext);
            //检查扩展名
            if (in_array($file_ext, $ext_arr[$dir_name]) === false) {
                $msg = "上传文件扩展名是不允许的扩展名。\n只允许" . implode(",", $ext_arr[$dir_name]) . "格式。";
                goto fail;
            }
            //创建文件夹
            if ($dir_name !== '') {
                $save_path .= $dir_name . "/";
                $save_url .= $dir_name . "/";
                if (!file_exists($save_path)) {
                    mkdir($save_path);
                }
            }
            $ymd = date("Ymd");
            $save_path .= $ymd . "/";
            $save_url .= $ymd . "/";
            if (!file_exists($save_path)) {
                mkdir($save_path);
            }
            //新文件名
            $new_file_name = date("YmdHis") . '_' . rand(10000, 99999) . '.' . $file_ext;

            //移动文件
            $file_path = $save_path . $new_file_name;


            if (move_uploaded_file($tmp_name, $file_path) === false) {
                $msg = "上传文件失败。";
                goto fail;
            }
            @chmod($file_path, 0644);

            $result['pic_raw_path'] = $file_path;
            $result['mime_type'] = mime_content_type($file_path);
            $image_size =  getimagesize($file_path);
            $result['raw_width'] = $image_size[0];
            $result['raw_height'] = $image_size[1];
            $file_url = $save_url . $new_file_name;
            $result['pic_raw_url'] = $file_url;
            $result['pic_path'] = $result['pic_raw_path'];
            $result['pic_url'] = $result['pic_raw_url'];

            //裁剪操作
            $result['width'] = $result['raw_width'];
            $result['height'] = $result['raw_height'];
            $result['file_size'] = $result['raw_file_size'];


            header('Content-type: text/html; charset=UTF-8');
            $result['response'] = array('error' => 0, 'url' => $file_url);
            return $result;

            fail:
            header('Content-type: text/html; charset=UTF-8');
            $result['response'] = array('response' => array('error' => 1, 'message' => $msg));
            return $result;
        }
    }
}
