<?php
//IMPORTANT
//set up session
session_start();

//IMPORTANT
//contians functions to generate header, footer and connect to a db
//Include files
require_once('functions_common.php');


//generate_header($scripts, $styles, $onload, $title);
$header = generate_header(array( "threejs/three.js", "threejs/TrackballControls.js", "shark_viewer.js"), array('bootstrap2.css'));
//generate_footer();
$footer = generate_footer();


$dvid_server = 'http://emrecon100.janelia.priv/api/node';
$uuid = '2a3';

$mode = isset($_GET['mode'])? $_GET['mode']:false;
$swc_file = isset($_GET['swc_file'])? $_GET['swc_file']:false;
$swc_file = is_numeric($swc_file)? $swc_file:false;

$selected_particle = "";
$selected_skeleton = "";
$selected_sphere = "";

if ($mode == 'skeleton'){
	$mode = 'skeleton';
	$selected_skeleton = "checked";
}
elseif ($mode == 'sphere'){
	$mode = 'sphere';
	$selected_sphere = "checked";
}
else {
	$mode = 'particle';
	$selected_particle = "checked";
}

if ($swc_file){
	$swc_file_api_call = "$dvid_server/$uuid/skeletons/$swc_file.swc";
	$swc_contents = file_get_contents($swc_file_api_call);
}

#find swc files located in directory
$swc_options = json_decode(file_get_contents("$dvid_server/$uuid/bodies/sizerange/1000000/100000000000"));
asort($swc_options);
?>

<!doctype html>
<html>
<?= $header ?>
<?php if ($swc_file){ ?>
<script id="swc" type='text/plain'>
<?= $swc_contents?>
</script>
<?php } ?>

<form action="Shark_Viewer.php" class='form-inline' method="get">
<label for='swc_file'>Body ID: </label><select id='swc_file' name='swc_file' autofocus='autofocus'>
<?php 
foreach ($swc_options as $swc){
	$swc = str_replace('.swc', '', $swc); 
	if ($swc === $swc_file){
		echo "<option value='$swc' selected=selected >$swc</option>";
	}
	else{
		echo "<option value='$swc' >$swc</option>";
	}
}
?>
</select>
<label class='radio inline' ><input type='radio' name='mode' value='skeleton' <?=$selected_skeleton?>>Skeleton</label>
<label class='radio inline' ><input type='radio' name='mode' value='particle' <?=$selected_particle?> >Particle</label>
<input type='submit' class='btn btn-info' value='Submit'>


</form>

	<!-- three.js container -->
    	<div id="container"></div>
	<!-- info on screen display -->


	<script type='text/javascript'>
	window.onload = function(){
		swc = swc_parser(document.getElementById("swc").text);
		s = new SharkViewer({
			swc: swc, 
			dom_element: 'container', 
			mode:'<?=$mode?>', 
			center_node: -1,  
			colors:['#b705bd', '#0649c7', '#04b03b', '#c78606', '#bd4608', '#bd1402', '#4f03c7', '#07a1b0', '#47c703', '#bd860b', '#e3088d', '#0c3fed', '#00d661', '#ede406', '#e36004', '#e31803', '#5e03ed', '#08c4d6', '#55ed03', '#e3a20d'] 
		});
		s.init()
		s.animate();
	}
	</script>
<?= $footer ?>
</body>
</html>


