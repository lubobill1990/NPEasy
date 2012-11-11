<?php
/**
 * Created by JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-10
 * Time: 下午3:34
 * To change this template use File | Settings | File Templates.
 */
class OAuthController extends Controller
{

    public function actionGetAuthorizedCode()
    {
        //check session_id in cache to get the cached auth_code
        $auth_code = Yii::app()->cache->get('npeasy_aux:session_id_2_auth_code:' . session_id());

        if (!empty($auth_code)) {
            $this->redirect('http://npeasy.com:3000/oauth/callback?auth_code=' . $auth_code);
            return;
        }

        $app = App::model()->findByAttributes(array('app_key' => $_REQUEST['app_key']));
        if (empty($app)) {
            return;
        }
        $auth_code = new AuthCode;

        $auth_code->attributes = array(
            'app_key' => $_REQUEST['app_key'],
            'auth_code' => Common::generateRandomString(50),
            'user_id' => Yii::app()->user->id or 0,
            'expire_till' => time() + 3600
        );
        if ($auth_code->validate() && $auth_code->save()) {
            //save auth_code to cache with the key of session_id
            Yii::app()->cache->set('npeasy_aux:session_id_2_auth_code:' . session_id(), $auth_code->auth_code);
            Yii::app()->cache->set('npeasy_aux:auth_code:' . $auth_code->auth_code, serialize($auth_code));
            $this->redirect('http://npeasy.com:3000/oauth/callback?auth_code=' . $auth_code->auth_code);
        } else {
            var_dump($auth_code->errors);
        }
    }

    public function actionGetAccessToken()
    {
        $app = App::model()->findByAttributes(array('app_key' => $_REQUEST['app_key'], 'app_secret' => $_REQUEST['app_secret']));
        if (!empty($app)) {
            //get $auth_code
            $auth_code_cache = Yii::app()->cache->get('npeasy_aux:auth_code:' . $_REQUEST['auth_code']);
            if (!empty($auth_code_cache)) { //if the auth_code exists in the cache
                $auth_code = unserialize($auth_code_cache);
                if ($auth_code->app_key != $_REQUEST['app_key']) { //if app_key does not match, then return
                    return;
                }

            } else {
                $auth_code = AuthCode::model()->findByAttributes(array('auth_code' => $_REQUEST['auth_code'], 'app_key' => $_REQUEST['app_key']));
                if (empty($auth_code)) {
                    return;
                }
            }
            $access_token=Yii::app()->cache->get('npeasy_aux:auth_code_2_access_token:'.$auth_code->auth_code);
            if(!empty($access_token)){
                $access_token=unserialize($access_token);
            }else{
                $access_token = new AccessToken;
                $access_token->attributes = array(
                    'app_key' => $_REQUEST['app_key'],
                    'access_token' => Common::generateRandomString(50),
                    'user_id' => $auth_code->user_id,
                    'expire_till' => time() + 36000
                );
                if($access_token->validate()&&$access_token->save()){
                    Yii::app()->cache->set('npeasy_aux:access_token:'.$access_token->access_token,serialize($access_token));
                    Yii::app()->cache->set('npeasy_aux:auth_code_2_access_token:'.$auth_code->auth_code,serialize($access_token));
                }
            }
            echo $access_token->access_token;
        }
    }

    public function actionRefreshAccessToken()
    {

    }

    public function actionGetUserInfo()
    {
        $res=Yii::app()->cache->get('npeasy_aux:access_token:'.$_REQUEST['access_token']);
        if(!empty($res)){
            $a_t=unserialize($res);
        }else{
            $a_t = AccessToken::model()->findByPk($_REQUEST['access_token']);
        }
        if (!empty($a_t)) {
            $user_model=Yii::app()->cache->get("npeasy_aux:user:{$a_t->user_id}");
            if(!empty($user_model)){
                $user_model=unserialize($user_model);
            }else{
                $user_model=User::model()->findByPk($a_t->user_id);
                unset($user_model->password);
                unset($user_model->salt);
                Yii::app()->cache->set("npeasy_aux:user:{$a_t->user_id}",serialize($user_model));
            }

            echo CJSON::encode($user_model);
        }
    }
}
