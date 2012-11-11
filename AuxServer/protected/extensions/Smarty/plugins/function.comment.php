<?php
/**
 * Created by JetBrains PhpStorm.
 * User: bolu
 * Date: 12-10-16
 * Time: 下午12:47
 * To change this template use File | Settings | File Templates.
 */
Yii::import('ext.feedback.CommentProxy');

function smarty_compiler_comment($params,  $smarty_tpl){
    CommentProxySingle::register($params['subject_type'],$params['subject_id']);
    return "<?php\nCommentProxy::render(".$params['subject_type'].','.$params['subject_id'].")\n?>";
}