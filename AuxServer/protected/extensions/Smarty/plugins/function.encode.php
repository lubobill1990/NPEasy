<?php

function smarty_function_encode($params, $template) {
    if(!isset($params['value'])) {
        return;
    }
    $value = $params['value'];
    return CHtml::encode($value);
}