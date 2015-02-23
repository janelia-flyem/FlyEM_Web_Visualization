<?php
/**
This is a boiler plate page to get you started in writing an infromatics page.

Some of the modules are important for all pages, but everything else can be deleted/moved.

A session is started and if a user is not logged in they are sent to ldap.php

Shows how to check permissions, connect to database, make queries and generate headers/footers


Charlotte Weaver 3/25/13
*/

//IMPORTANT
//set up session
session_start();

//IMPORTANT
//contians functions to generate header, footer and connect to a db
//Include files
require_once('functions_common.php');


//generate_header($scripts, $styles, $onload, $title);
$header = generate_header(array("sigma/sigma.min.js", "sigma/plugins/sigma.parsers.json.min.js", "sigma/plugins/sigma.renderers.customShapes.min.js", "threejs/three.js", "threejs/TrackballControls.js", "shark_viewer.js", "magicsuggest-1.3.1.js"), array("magicsuggest-1.3.1.css", "bootstrap2.css"));
//generate_footer();
$footer = generate_footer();

?>

<!DOCTYPE html>
<html>
<?= $header ?>
<div class='form-inline'>
	<label for='edgefilter'>Min Edge Weight:</label><input type='range' min=3 max=50 id='edgefilter' value=5>&nbsp<span id='edgeval'>5</span>&nbsp
	<label for='view_2d'> View Plane:</label>
	<div id='view_2d' class='btn-group' data-toggle="buttons-radio">
		<button class='btn' id='xy'>xy</button>
		<button class='btn' id='yz'>yz</button>
		<button class='btn' id='xz'>xz</button>
	</div>
</div>
<div class='form-inline'>
  <label for='label_search' style="vertical-align:top">Neuron Label Search:</label><input id='label_search' type="text" autocomplete='off' style='display:inline-block' >
  <button id='label_submit' class="btn" style="vertical-align:top">Search</button>
</div>
<div id='shark_form' class='form-inline'>
<label for='neighbors'>Include neighbors: </label><input type='checkbox' id='neighbors'>
<button id='shark_viewer' class='btn btn-primary'>View in SharkViewer</button>
<span id='ajax_span'  style='display:none;'>Generating skeletons. This may take several minutes.<img src='images/loading.gif' id='ajax_img'  /></span>
</div>
<div class='row'>
<div id="gorgonian" class='span8'></div>
<div id="shark" class='span4' ></div>
</div>
<?= $footer ?>
</body>
</html>

