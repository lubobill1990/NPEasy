<?php
/**
 * Created by JetBrains PhpStorm.
 * User: bolu
 * Date: 12-10-24
 * Time: 上午10:41
 * To change this template use File | Settings | File Templates.
 */
class ExecuteBuffer
{
    private $_output_placeholder=array();
    public function init(){
    }
    public function append($lazy_process,$lazy_process_params=null){

        $this->addObBufferToOutputPlaceholder();

        $this->_output_placeholder[]=array('type'=>'function','function'=>$lazy_process,'params'=>$lazy_process_params);
    }
    private function addObBufferToOutputPlaceholder(){
        $this->_output_placeholder[]=array('type'=>'text','content'=>ob_get_contents());
        ob_clean();
    }

    /**
     * 输出$_output_placeholder内的内容，
     * 如果是文本，则直接输出
     * 如果是函数，则执行后输出返回值
     */
    public function flush(){
        //添加执行append之后的output到_output_placeholder
        $this->addObBufferToOutputPlaceholder();
        foreach($this->_output_placeholder as $val){
            if($val['type']=='text'){
                echo $val['content'];
            }elseif($val['type']=='function'){
                echo $val['function']($val['params']);
            }
        }
        $this->_output_placeholder=array();
    }
}
