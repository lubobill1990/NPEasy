<?php

function smarty_modifier_key_exists($array,$key) {
    return array_key_exists($key,$array);
}

?>