<?php

function generate_header($scripts, $styles, $onload="", $title=NULL, $nav=NULL){
	/**
	Generated a standard header and loads javascript and css.
	
	$scripts = array of scripts to load from /js. (autoloads base_url.js, labcommon.js and jquery.js)
	$styles = array of css files to load from /css. (autoloads labcommon.css and light/dark versions of base_url.css)
	$onload = javascript routines to fire upon page load
	$title = Title for webpage. (if none given defaults to url capitalized and with slashes and underscores replaced

	TO USE
	$header = generate_header(array('script1.js'), array('style1.css')');
	$header = generate_header(array('script1.js'), array('style1.css'), 'load(); alert(\"hi!\");', 'New Title', '<html for navbar using bootstrap>');
	echo $header;
	*/
	
	$uri = htmlentities($_SERVER['PHP_SELF']);
	$base_uri = preg_replace(array('#^.*/#', '/\..*$/'), array('', ''),  $uri);

	//Title
	if (!isset($title) or !$title){
		$title = preg_replace(array('/_/', '#/#', '/\..*$/'), array(' ', '', ''),  $uri);
		$title = ucwords(strtolower($title));
	}

	//Scripts
	//make sure jQuery loads first
	array_unshift($scripts, "jquery/jquery-latest.js");
	$scripts[] = "bootstrap.js";
        if (file_exists("/var/www/html/js/$base_uri.js"))
		array_push($scripts,"$base_uri.js");
		array_push($scripts,"labcommon.js");
	$scripts_print = "";
	foreach ($scripts as $script){
		$scripts_print .= "<script type='text/javascript' src='/js/$script'></script>\n";
	}

	//Styles
	$styles[] = "labcommon.css";
	$styles[] = "bootstrap.css";
	$styles_print = "";
	foreach ($styles as $style){
		$styles_print .= "<link href='/css/$style' rel='stylesheet' type='text/css'>";
	}
        if (file_exists("/var/www/html/css/$base_uri.css"))
	  $styles_print .= "<link href='/css/$base_uri.css'  rel='stylesheet' type='text/css'>";
        if (file_exists("/var/www/html/css/$base_uri"."_dark.css"))
	  $styles_print .= "<link href='/css/$base_uri"."_dark.css'  rel='stylesheet' type='text/css'>";

	//Onload
	$onload_print = "onload=\"loadstyle(); ";
	if(isset($onload) and $onload){
		$onload = preg_replace('/"/', "'", $onload);
		$onload_print .= "$onload";
	}
	$onload_print .= '"';
	$header = <<<EOD
<head>
<title>$title</title>
$scripts_print
$styles_print
</head>
<body $onload_print onunload="unloadstyle();">
<div class='navbar navbar-fixed-top'>
	<div class='navbar-inner'>
			<a class='brand' href='$uri'>$title</a>
			$nav
			<img class='pull-right' src="/images/gray_janelia_logo.png">
	</div>
</div>
<div style='margin-bottom:80px !important'></div>
EOD;
	return $header;
}

function generate_footer(){
	/**
	Generates a standard footer with login/logout links depending on if user is logged in or not.
	
	TO USE
	$footer = generate_footer();
	echo $footer;
	*/
	if (!$_SESSION) session_start();
	$footer = <<<EOD
<br>
<hr style='margin: 0px'>
<div class='footer' id='footer'>
	<div class='pull-right'>
		© 2015 Janelia Farm Research Campus
		<br>
		19700 Helix Drive, Ashburn, VA 20147 | (571) 209-4000
	</div>
</div>
EOD;
	return $footer;
}

function error_page($message="", $title=NULL){
	/**
	Generates and error page and then exits. 

	TO USE
	error_page("This is the error message", "Alternative Title")
	*/
	$header = ($title)? generate_header("","","",$title):generate_header("","");
	$footer = generate_footer();
	$output =" 
<!DOCTYPE html>
<html>
	$header
	<div class='container'>
		<div class='row'>
			<div class='span12'>
				<h3 class='text-warning'>
					<img src='/images/triangle_caution.png'>$message
				</h3>
			</div>
		</div>
	</div>
	$footer
	</body>
</html>
";
	echo $output;
	exit;
} 

?>
