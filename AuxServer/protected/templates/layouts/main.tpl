<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
{include file='layouts/header.tpl'}
<div id="wrapper">
    <div class="container">
    {if $content_tpl|default:''}

    {include file=$content_tpl}
    {/if}

    {if $tpl_content|default:''}
        {$tpl_content}
    {/if}
    </div>
</div>
{include file='layouts/footer.tpl'}
<div class="testArea"></div>

<script type="text/javascript" src='//npeasy.com:13050/js/jquery-1.8.2.min.js'></script>
<iframe id="comet" src="//npeasy.com:13050/html/comet.html" style="display: none;"></iframe>
</body>

</html>
