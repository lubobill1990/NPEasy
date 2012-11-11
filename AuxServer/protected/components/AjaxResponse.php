<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Usbuild
 * Date: 12-8-6
 * Time: 上午11:23
 */
class AjaxResponse
{
    const SUCCESS = 100;
    const MISSING_PARAM = 201;
    const NO_APP = 202;
    const NO_EVENT = 203;
    const NO_LISTENER = 204;
    const NOT_PRIVATE = 205;
    const UPDATE_NOT_EXISTS = 206;
    const DELETE_NOT_EXISTS = 207;
    const NOT_AUTHORIZED = 301;
    const RESOURCE_LIMIT = 302;
    const TYPE_ERROR = 401;
    const REQUEST_METHOD_ERROR = 402;
    const ILLEGAL_PARAM = 403;
    const UNKNOWN_OPTION = 404;
    const RESOURCE_OCCUPIED = 405;
    const TIME_OUT = 406;
    const DB_ERROR = 501;
    const UPLOAD_FAILED = 502;
    static $codeMap = array(
        self::SUCCESS => 'OK',
        self::MISSING_PARAM => 'Missing Required Params',
        self::NO_APP => 'No Such App',
        self::NO_EVENT => 'No Such Event',
        self::NO_LISTENER => 'No Such Listener',
        self::NOT_PRIVATE => 'Not A Private Event',
        self::UPDATE_NOT_EXISTS => 'Update Item Not Exist',
        self::DELETE_NOT_EXISTS => 'Delete Item Not Exist',
        self::NOT_AUTHORIZED => 'Not Authorized',
        self::RESOURCE_LIMIT => 'Out Of Resource Limit',
        self::TYPE_ERROR => 'Type Error',
        self::UNKNOWN_OPTION => 'Unknown Option',
        self::RESOURCE_OCCUPIED => 'Resource Occupied',
        self::REQUEST_METHOD_ERROR => 'Request Method Error',
        self::ILLEGAL_PARAM => 'Illegal Param',
        self::TIME_OUT =>'Time Out',
        self::DB_ERROR => 'Cant\'t Update Database',
        self::UPLOAD_FAILED => 'Upload Failed',
    );

    static function send($errno, $data = NULL, $exit = true)
    {
        if (array_key_exists($errno, self::$codeMap)) {
            if($errno == self::SUCCESS)
                echo CJSON::encode(array('success'=>true, 'code' => $errno, 'data' => is_null($data) ? self::$codeMap[$errno] : $data));
            else if (is_null($data))
                echo CJSON::encode(array('success'=>false, 'code' => $errno, 'data' => self::$codeMap[$errno]));
            else
                echo CJSON::encode(array('success'=>false, 'code' => $errno, 'data' => $data));
            if ($exit) Yii::app()->end();
        } else {
            echo CJSON::encode(array('success' => false, 'code' => $errno, 'data' => 'Unknown Error'));
            Yii::app()->end();
        }
    }
}
