<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Tracy zhen
 * Date: 12-9-9
 * Time: 上午10:57
 * To change this template use File | Settings | File Templates.
 */
function smarty_compiler_clistview($params, Smarty $smarty){
       if(array_key_exists('dataProvider', $params) && array_key_exists('itemView',$params) ) {
          $phpcode="
            <?php ".$params['object']."->widget('zii.widgets.CListView', array(
            'dataProvider' =>". $params['dataProvider'].",
            'itemView' => ".$params['itemView'].",
        )); ?>";
           return $phpcode;
       }else{
           throw new Exception('You should give the required parameters');
       }
}