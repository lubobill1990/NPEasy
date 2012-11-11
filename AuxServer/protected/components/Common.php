<?php
//Get the real client IP ("bullet-proof")

class Common
{
    public static $npeasyPostSecret = "5199DED1ECBBF664AD4376306FD45F19";

    public static function getCurrentUserObj()
    {
        if (Yii::app()->user->isGuest) {
            return null;
        } else {
            return User::model()->findByPk(Yii::app()->user->id);
        }
    }

    public static function requireRequests($fields)
    {
        foreach ($fields as $field) {
            if (!isset($_REQUEST[$field])) {
                AjaxResponse::send(AjaxResponse::MISSING_PARAM);
            }
        }
    }

    public static function cropPicture($url, $top, $left, $width, $height)
    {
        $base_path = $_SERVER['DOCUMENT_ROOT'] . '/';
        $pic_path = $base_path . $url;
        if (!file_exists($pic_path)) {
            AjaxResponse::send(AjaxResponse::ILLEGAL_PARAM);
        }
        $imagesize = getimagesize($pic_path);
        if ($width > $imagesize[0] || $height > $imagesize[1]) {
            AjaxResponse::send(AjaxResponse::ILLEGAL_PARAM);
        }

        $img = new Imagick($pic_path);
        if ($img == null) {
            AjaxResponse::send(AjaxResponse::ILLEGAL_PARAM);
        }
        $img->cropimage($width, $height, $left, $top);
        $salt = 'thumb-' . rand(0, 99999) . '-';
        $dst_file = dirname($pic_path) . '/' . $salt . basename($pic_path);
        $img->writeimage($dst_file);
        return dirname($url) . '/' . basename($dst_file);
    }

    public static function resizePictures($src_pic_url, $sizes)
    {
        $base_path = $_SERVER['DOCUMENT_ROOT'];
        $src_pic_path = $base_path . $src_pic_url;
        if (!file_exists($src_pic_path)) {
            AjaxResponse::send(AjaxResponse::ILLEGAL_PARAM);
        }
        $new_urls = array();
        foreach ($sizes as $size) {
            try {
                $width = $size['width'];
                $height = $size['height'];
            } catch (Exception $e) {
                AjaxResponse::send(AjaxResponse::ILLEGAL_PARAM);
            }
            $img = new Imagick($src_pic_path);
            $img->resizeimage($width, $height, imagick::STYLE_NORMAL, 1, true);
            $salt = 'thumb-' . rand(0, 99999) . '-';
            $dst_file = dirname($src_pic_path) . '/' . $salt . basename($src_pic_path);
            $img->writeimage($dst_file);
            $new_urls[] = dirname($src_pic_url) . '/' . basename($dst_file);
        }
        return $new_urls;
    }

    public static function getSomeAttributesOfObj($needed_array, $obj)
    {
        $tmp = array();
        foreach ($needed_array as $k => $col) {
            if (is_numeric($k)) {
                $tmp[$col] = isset($obj->$col) ? ($obj->$col) : null;
            } else {
                $tmp[$k] = isset($obj->$k) ? ($obj->$k) : $col;
            }
        }
        return $tmp;
    }

    public static function getSomeAttributesOfObjArray($needed_array, $obj_array)
    {
        $arr = array();
        foreach ($obj_array as $obj) {
            $arr[] = self::getSomeAttributesOfObj($needed_array, $obj);
        }
        return $arr;
    }

    public static function sortUserInstalledApps(&$uias)
    {
        usort($uias, function ($uia1, $uia2) {
            if ($uia1->user_app_seq != $uia2->user_app_seq) {
                return $uia2->user_app_seq - $uia1->user_app_seq;
            } else {
                return $uia1->app->create_time > $uia2->app->create_time;
            }
        });
        return $uias;
    }

    public static function encryptPassword($password, $salt)
    {
        return trim(md5(md5($password) . $salt));
    }

    const GUEST = 1; // 'guest'
    const AUTH_USER = 2; // 'auth_user'
    const ADMIN = 4; //'admin'
    const NOT_GUEST = 6; // AUTH_USER|ADMIN

    public static function ajaxRequireIdentity($identity)
    {
        $current_identity = self::getCurrentUserRole();
        if ($current_identity != ($current_identity & $identity)) // insufficient permission
        {
            AjaxResponse::send(AjaxResponse::NOT_AUTHORIZED);
        }
    }

    /**
     * @static
     * @param $identity: eg. Common::$ADMIN|Common::$SPEAKER
     */
    public static function requireIdentity($identity, $controller)
    {
        $current_identity = self::getCurrentUserRole();
        if ($current_identity == ($current_identity & $identity)) // sufficient permission
        {
            return true;
        } else // insufficient permission
        {
            $controller->redirect(CHtml::normalizeUrl(array('/site/insufficientPermission')));
            return false;
        }
    }

    public static function init()
    {
        Common::sendMailDaemon();
    }

    private static $log_path = '/tmp/simu_lubo.log';

    public static function log($content)
    {
        ob_start();
        echo($content);
        $content = ob_get_clean();

        $file = fopen(Common::$log_path, 'w+');
        fwrite($file, $content . date('Y-m-j G::i:s') . '\n');
        fclose($file);
    }

    public static function getCurrentUserRole()
    {
        $user = User::model()->findByPk(Yii::app()->user->id);
        if ($user == null) {
            return self::GUEST; // 游客
        } else {
            $simu_user_role = $user->simu_user_role;
            if ($simu_user_role == null) {
                return self::AUTH_USER; // 登陆用户（普通用户）
            } else if ($simu_user_role->role == 'admin') {
                return self::ADMIN; // 管理员
            } else {
                return self::AUTH_USER; // 其他情况，暂定登陆用户
            }
        }
    }

    static function getClientIp()
    {
        if (getenv("HTTP_CLIENT_IP") && strcasecmp(getenv("HTTP_CLIENT_IP"), "unknown"))
            $ip = getenv("HTTP_CLIENT_IP");
        else if (getenv("HTTP_X_FORWARDED_FOR") && strcasecmp(getenv("HTTP_X_FORWARDED_FOR"), "unknown"))
            $ip = getenv("HTTP_X_FORWARDED_FOR");
        else if (getenv("REMOTE_ADDR") && strcasecmp(getenv("REMOTE_ADDR"), "unknown"))
            $ip = getenv("REMOTE_ADDR");
        else if (isset($_SERVER['REMOTE_ADDR']) && $_SERVER['REMOTE_ADDR'] && strcasecmp($_SERVER['REMOTE_ADDR'], "unknown"))
            $ip = $_SERVER['REMOTE_ADDR'];
        else
            $ip = "unknown";
        return $ip;
    }

    static function currentSqlTimeStamp()
    {
        return strftime("%Y-%m-%d %H:%M:%S");
    }

    static function mail($email, $subject, $content, $username = '思目网用户')
    {
        self::sendMail($email, $username, $subject, $content);
    }

    protected static $mail = null;

    public static function getMail()
    {
        if (self::$mail == null) {
            self::$mail = new PHPMailer();
            self::$mail->IsSendmail();

            self::$mail->IsSMTP();
            self::$mail->Host = Yii::app()->params['emailHost'];
            self::$mail->SMTPAuth = true;
            self::$mail->Username = Yii::app()->params['emailUsername'];
            self::$mail->Password = Yii::app()->params['emailPassword'];
            self::$mail->Port = Yii::app()->params['emailSMTPPort'];
            self::$mail->From = Yii::app()->params['emailFrom'];
            self::$mail->FromName = Yii::app()->params['emailFromName'];
        }
        return self::$mail;
    }

    public static function actualSendMail($address, $username, $subject, $body, $alt_body, $from_name)
    {
        $mail = self::getMail();
        $mail->AddAddress($address, $username);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->AltBody = $alt_body; // optional, comment out and test
        $mail->FromName = $from_name;
        if (!$mail->Send()) {
            return false;
        } else {
            return true;
        }
    }

    private static $send_mail_daemon_running = true;
    public static $send_mail_daemon_actived = false;

    public static function sendMailDaemon()
    {
        while (Common::$send_mail_daemon_running) {
            $transaction = Yii::app()->db->beginTransaction();
            try {
                $criteria = new CDbCriteria();
                $criteria->order = 'create_time asc';
                $criteria->limit = '10';
                $criteria->addCondition("state='not_sended'");
                $emails = EmailToSend::model()->findAll($criteria);
                foreach ($emails as $email) {
                    if (Common::actualSendMail(
                        $email->to_address, $email->to_alias_name,
                        $email->subject, $email->body, $email->alt_body, $email->from_alias_name
                    )
                    ) {
                        $email->state = 'sended';
                        $email->save();
                    }
                }
                $transaction->commit();
            } catch (Exception $e) {
                $transaction->rollback();
                Common::log($e->getMessage());
            }
            sleep(500);
        }
    }

    public static function sendMail($address, $username, $subject, $body)
    {
        $email_to_send = new EmailToSend();
        $email_to_send->body = "<!DOCTYPE html><html><head><meta charset='utf8'></head>$body</html>";
        $email_to_send->from_alias_name = Yii::app()->params['emailFromName'];
        $email_to_send->to_alias_name = $username;
        $email_to_send->subject = $subject;
        $email_to_send->to_address = $address;
        $email_to_send->alt_body = Yii::app()->params['emailAltBody'];
        $email_to_send->save();
    }


    public static function removeFields($fields, &$input)
    {
        foreach ($fields as $field) {
            if (array_key_exists($field, $input)) {
                unset($input[$field]);
            }
        }
        return $input;
    }

    public static function endsWith($str, $end)
    {
        $len1 = strlen($str);
        $len2 = strlen($end);
        if ($len1 < $len2) {
            return false;
        }
        if (substr($str, $len1 - $len2, $len2) === $end) {
            return true;
        }
        return false;
    }

    public static function register($file, $global = false, $module = null)
    {
        $module_id = NULL;
        if ($module !== null) {
            $module_id = $module;
        } else {
            if (!$global) {
                $module = Yii::app()->controller->module;
                if (!empty($module)) {
                    $module_id = $module->id;
                }
            } else {
                $module_id = NULL;
            }
        }


        $file_type = '';
        if (Common::endsWith($file, 'js')) {
            $file_type = 'js';
        } else if (Common::endsWith($file, 'css')) {
            $file_type = 'css';
        } else {
            $file_type = 'images';
        }
        if ($module_id === NULL) {
            $url = Yii::app()->assetManager->publish(
                Yii::getPathOfAlias('application') . '/../' . $file_type, false, -1, true);
        } else {
            $url = Yii::app()->assetManager->publish(
                Yii::getPathOfAlias('application.modules.' . $module_id . '.assets.' . $file_type), false, -1, true);
        }

        $path = $url . '/' . $file;
        if (Common::endsWith($file, 'js')) {
            return Yii::app()->clientScript->registerScriptFile($path);
        } else if (Common::endsWith($file, 'css')) {
            return Yii::app()->clientScript->registerCssFile($path);
        }
        return $path;
    }

    public static function  httpPost($url, array $postFiled)
    {
        //echo $url;
        // print_r($postFiled);
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        //curl_setopt($ch, CURLOPT_READDATA, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($postFiled) ? http_build_query($postFiled) : $postFiled);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        curl_close($ch);
        Common::log(http_build_query($postFiled) . $url);
    }

    /**
     * PHP截取UTF-8字符串，解决半字符问题。
     * 英文、数字（半角）为1字节（8位），中文（全角）为3字节
     * @static
     * @param $str 源字符串
     * @param $len 左边的子串的长度
     * @return string 取出的字符串, 当$len小于等于0时, 会返回整个字符串
     */
    public static function  utf_substr($str, $len)
    {
        for ($i = 0; $i < $len; $i++) {
            $temp_str = substr($str, 0, 1);
            if (ord($temp_str) > 127) {
                $i++;
                if ($i < $len) {
                    $new_str[] = substr($str, 0, 3);
                    $str = substr($str, 3);
                }
            } else {
                $new_str[] = substr($str, 0, 1);
                $str = substr($str, 1);
            }
        }
        return implode('', $new_str);
    }

    static function getIntervalTime($interval_seconds)
    {
        if ($interval_seconds < 30) {
            return "刚刚";
        }
        $minutes = floor($interval_seconds / 60);
        $hours = floor($minutes / 60);
        $days = floor($hours / 24);
        $months = floor($days / 30);
        $years = floor($days / 365);
        if ($years != 0) {
            return $years . "年前";
        }
        if ($months != 0) {
            return $months . '个月前';
        }
        if ($days != 0) {
            return $days . '天前';
        }
        if ($hours != 0) {
            return $hours . '小时前';
        }
        if ($minutes != 0) {
            return $minutes . '分钟前';
        }
        return "刚刚";
    }

    static function getIntervalTimeTillNow($timestamp)
    {
        return self::getIntervalTime(time() - $timestamp);
    }

    /**
     * @param $content
     * @return string
     */
    function unhtml($content)
    {
        $content = htmlspecialchars($content); //转换文本中的特殊字符
        $content = str_ireplace(chr(13), "<br>", $content); //替换文本中的换行符
        $content = str_ireplace(chr(32), " ", $content); //替换文本中的
        $content = str_ireplace("[_[", "<", $content); //替换文本中的小于号
        $content = str_ireplace(")_)", ">", $content); //替换文本中的大于号
        $content = str_ireplace("|_|", " ", $content); //替换文本中的空格
        $content = str_ireplace(array("\n", "\r\n"), "<br>", $content);
        return trim($content); //删除文本中首尾的空格
    }

    /**
     * 将数组$arr分成$count组，假设$arr长为7，$count=3，则0,3,6一组,1,4一组,2,5一组
     * @param $arr
     */
    public static function slice_array($arr, $count)
    {
        $result = array();
        for ($i = 0; $i < count($arr); $i++) {
            $result[$i % $count][] = $arr[$i];
        }
        return $result;
    }

    public static function useDefaultIfUndefinedOrNotInArray($default, $src_array, $property, $func)
    {
        if (!isset($src_array[$property])) {
            return $default;
        }
        $tmp = $src_array[$property];
        if (!$func($tmp)) {
            return $default;
        }
        return $tmp;
    }

    public static function microtime()
    {
        list($usec, $sec) = explode(" ", microtime());
        return ((float)$usec + (float)$sec);
    }

    public static function generateRandomString($length=50){
        $multi=$length%40+1;
        $random_string='';
        for($i=0;$i<$multi;++$i){
            $random_string.=sha1(rand(1,100000).$_SERVER['REQUEST_TIME'].rand(1,100000));
        }
        return substr($random_string,0,$length);
    }
}

?>