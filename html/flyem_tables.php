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
$header = generate_header(array("simple_statistics.js"), array());
//generate_footer();
$footer = generate_footer();
$table_json = file_get_contents('js/em_exports/em_table_hackathon.json');
$core_json = file_get_contents('js/core.json');
?>

<!DOCTYPE html>
<html>
<?= $header ?>
<script id='table_json' type='text/plain'><?= $table_json ?></script>
<script id='core_json' type='text/plain'><?= $core_json ?></script>
<div id='em_table'>
</div>
<?= $footer ?>
</body>
</html>

