<?php

function add_to_swc($swc_data_str, $value_to_add, $swc_type_count){
	$max_id = 0;
	$sarr = explode("\n", $swc_data_str);
	foreach ($sarr as $idx=>$s){
		if ($s === ''){
			continue;
		}
		$line = explode(" ", $s);
		$line[0] = (int) $line[0] + $value_to_add;
		if ($line[0] > $max_id) $max_id = $line[0];
		$line[1] = $swc_type_count;
		if ((int) $line[6] != -1){ 
			$line[6] = (int) $line[6] + $value_to_add;
		}
		$joined = implode(" ", array_slice($line, 0,7));
		$sarr[$idx] = $joined;
	}
	$rarr = implode("\n", $sarr);
	return array('swc' => $rarr, 'max_id' => $max_id);
}

function swc_parser($swc_data){
	$swc_ar = explode("\n", $swc_data);
	$swc_json = array();
	$float = '-?\d*(?:\.\d+)?';
        $pattern_ar  =  array(
                '\d+',   // index
                '\d+',  // type
                $float,    // x
                $float,    // y
                $float,    // z
                $float,    // radius
                '-1|\d+' // parent
	);
	$regex = '/^[ \t]*(' . implode(')[ \t]+(', $pattern_ar) .  ')[ \t]*$/';
	foreach ($swc_ar as $swc_ln){
		if (preg_match($regex, $swc_ln, $match)) {
			$swc_json[$match[1]] = array (
				'type' => (int) $match[2],
				'x' => (float) $match[3],
				'y' => (float) $match[4],
				'z' => (float) $match[5],
				'radius' => (float) $match[6],
				'parent' => (int) $match[7],
			);
		}
	}
//	return json_encode($swc_json);
	return $swc_json;
}

//get body ids from post
$bodies = isset($_POST['bodies'])? $_POST['bodies']:false;
if (! $bodies){
	echo "Failure";
	return;
}

//set up bodies for filename and skeletonization service
$body_arr = array_map('intval', $bodies);
sort($body_arr);
$inner_file = implode("_", $body_arr);
if (strlen($inner_file) > 245) {
	$inner_file = substr($inner_file, 0, 245) . "...";
}
$file_name = "apache_swc/em_". $inner_file .".swc";
$metadata_file_name = "apache_swc/metadata/em_". $inner_file .".json";

$count = 0;
$swc_type_count = 0;
$swc_combined = "";
$names_file = file_get_contents('http://emdata1.int.janelia.org/api/node/2a3/gorgonian/em_name_dict.json');
$names_dict = json_decode($names_file, true);
trigger_error($names_dict);
$metadata_ar = array();
foreach($body_arr as $swc_id) {
	$fn = "http://emdata1.int.janelia.org/api/node/2a3/skeletons/$swc_id.swc";
	$swc_data = file_get_contents($fn);
	$add_ar = add_to_swc($swc_data, $count, $swc_type_count);
	$name = $names_dict[$swc_id]? $names_dict[$swc_id]:$swc_id;
	$metadata = array('label' => $name,
			'type' => $swc_type_count,
			'id_range' => array($count+1, $add_ar['max_id']),
			'body_id' => $swc_id
	);
	$swc_combined .= $add_ar['swc'];
	$count = $add_ar['max_id'];
	$swc_type_count++; 
	array_push($metadata_ar, $metadata);
}


//write out file to be used with shark viewer
file_put_contents($file_name, $swc_combined);
file_put_contents($metadata_file_name, json_encode($metadata_ar));
$swc_json = swc_parser($swc_combined);
$return_json = array( 'data' => $swc_json, 'metadata' => $metadata_ar, 'filename' => $file_name);
$return = json_encode($return_json);
echo $return;
return;


?>
