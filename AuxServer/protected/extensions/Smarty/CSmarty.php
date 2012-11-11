<?php
/**
 *Author:Elite
 */
require_once (Yii::getPathOfAlias('ext.Smarty') . DIRECTORY_SEPARATOR . 'Smarty.class.php');
define('SMARTY_VIEW_DIR', Yii::getPathOfAlias('application.templates'));

class CSmarty extends Smarty
{
    const DIR_SEP = DIRECTORY_SEPARATOR;
    private $module_template_dir_key = NULL;
    public $templateDirs;
    function __construct()
    {
        parent::__construct();

        $this->addTemplateDir(SMARTY_VIEW_DIR, '0');
        $this->setCompileDir(SMARTY_DIR . 'templates_c');
        $this->setConfigDir(SMARTY_DIR . 'configs');
        $this->setCacheDir(SMARTY_DIR . 'cache');
        $this->caching = false;

        $this->left_delimiter = '{';
        $this->right_delimiter = '}';
        $this->cache_lifetime = 3600;
        $this->debugging = false;
    }

    function init()
    {
        foreach($this->templateDirs as $key=>$val){
            $this->addTemplateDir(Yii::getPathOfAlias($val),$key);
        }
        if (!empty(Yii::app()->controller->module)) {
            $this->module_template_dir_key = Yii::app()->controller->module->id;
            $this->addTemplateDir(Yii::app()->controller->module->basePath . '/templates', $this->module_template_dir_key);
        } else {
            $this->module_template_dir_key = 0;
        }
        if (Yii::app()->user->isGuest) {
            $user = new AnonymousUser();
        } else {
            $user = User::model()->findByPk(Yii::app()->user->id);
        }
        $this->assign('user', $user);
    }

    private function makeLink()
    {

    }

    public function assignValue($array)
    {
        if ($array === null) {
            return;
        }
        if (!is_array($array)) {
            throw new Exception("template value should be an array", 1);
        }
        foreach ($array as $key => $val) {
            $this->assign($key, $val);
        }
    }

    /**
     * 规范化template变量，是指符合条件
     * @param $template 模板名或者路径
     * @param $use_module_template_dir 是否使用模块中的templates目录
     * @param $absolute_template_path  是否从templates目录开始的绝对路径，而非templates/{controllerId}目录中的模板
     * @return string 规范化后的template变量
     * @throws Exception 如果从绝对路径开始，但是没有提供template变量，则抛出异常
     */
    private function normalizeTemplate($template, $use_module_template_dir, $absolute_template_path = false)
    {
        //如果$template参数是从templates目录开始的绝对路径，则不需要自动构造$template参数，但是$template一定不是null
        if ($absolute_template_path) {
            if ($template === NULL) {
                throw new Exception('You should give the template parameter');
            }
        } else {
            if ($template == NULL) {
                $template = Yii::app()->controller->id . '/' . Yii::app()->controller->action->id . '.tpl';
            } else {
                $template = Yii::app()->controller->id . '/' . $template;
            }
        }
        //如果使用模块内的templates目录，则需要指明templateDir的key
        $template_path = '';
        if ($use_module_template_dir) {
            $template_path = 'file:[' . $this->module_template_dir_key . ']' . $template;
        } else {
            $template_path = 'file:[0]' . $template;
        }
        return $template_path;
    }

    /**
     * 获取通过Common::register()和Common::registerOutController()注册的静态文件的html代码
     * @return string css/js等静态文件的html代码
     */
    protected function getScripts()
    {
        $scripts = '<head><title></title></head>';
        Yii::app()->clientScript->render($scripts);
        $scripts = substr($scripts, 6, -22);
        return $scripts;
    }

    /**
     * smarty根据注册的变量渲染相应的模板
     * @param null $template 模板路径
     * @param array $array   注册变量的数组
     * @param bool $absolute_template_path 模板的路径是否为相对于templates目录的绝对路径，如果为否，则为相对于templates/{controllerId}目录的路径
     * @param bool $use_module_template_dir 是否使用模块中的templates目录
     */
    function render($template = NULL, $array = array(), $absolute_template_path = false, $use_module_template_dir = true, $include_static_file = false)
    {
        $this->assignValue($array);
        $template = $this->normalizeTemplate($template, $use_module_template_dir, $absolute_template_path);
        //if ($include_static_file)
        //    echo $this->getScripts();
        $this->display($template);
    }


    /**
     * @param null $template
     * @param array $array
     * @param string $layout
     * @param bool $absolute_template_path
     * @param bool $use_module_template_dir
     */
    function renderAll($template = NULL, $array = array(), $layout = 'file:[0]layouts/main.tpl', $absolute_template_path = false, $use_module_template_dir = true)
    {
        $this->assignValue($array);
        $template = $this->normalizeTemplate($template, $use_module_template_dir, $absolute_template_path);
        $this->assign('script_tpl', $this->getScripts());
        $this->assign('content_tpl', $template);
        $this->display($layout);
    }

    function fetchString($template = NULL, $array = array(), $absolute_template_path = false, $use_module_template_dir = true)
    {
        $this->assignValue($array);
        $template = $this->normalizeTemplate($template, $use_module_template_dir, $absolute_template_path);
        return /*$this->getScripts() .*/ parent::fetch($template);
    }

}

