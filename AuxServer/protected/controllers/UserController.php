<?php
/**
 * Created by JetBrains PhpStorm.
 * User: bolu
 * Date: 12-11-10
 * Time: 下午3:04
 * To change this template use File | Settings | File Templates.
 */
class UserController extends Controller
{
    public function actionRegister(){
        if(Yii::app()->request->isPostRequest){
            $model=new User();
            $model->attributes=$_POST['User'];
            $model->save();

        }else{
            $this->smarty->renderAll('register.tpl');
        }
    }

}
