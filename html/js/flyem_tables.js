var color_dict = {};
var nt_dict = {};
var types_index = {
	'L1': 0,
	'Mi1': 1,
	'T4': 2,
	'Tm3': 3,
	'L5': 4,
	'C2': 5,
	'T2(a)': 6,
	'L2': 7,
	'Tm1': 8,
	'C3': 9,
	'Tm2': 10,
	'T1': 11,
	'Tm4': 12,
	'T2': 13,
	'L4': 14,
	'TmY5': 15,
	'Tm6': 16,
	'R8': 17,
	'L3': 18,
	'Mi4': 19,
	'Mi9': 20,
	'R7': 21,
	'Tm20': 22,
	'Dm8': 23,
	'Tm9': 24,
	'Dm2': 25,
	'Mi15': 26,
}
var data_dict = {};
var current_file = false;
var comparison = false;
var core;
function json_data_from_file( filename ) {
	current_file = filename;
	$('#em_table').html('');
	$('#compare_select').show();
	if (filename in data_dict) {
		generate_tables(data_dict[filename]);
	}
	else {
		$.getJSON( filename, function( data ) {
			data_dict[filename] = data;
			generate_tables(data);
			data = '';
		});
	}
}

function compare_to(value) {
	comparison = value;
	$('#em_table').html('');
	if (comparison === '') {
		comparison = false;
		generate_tables(data_dict[current_file]);
	}
	else if(comparison && comparison in data_dict) {
		generate_tables(data_dict[current_file]);
	}
	else {
		$.getJSON( comparison, function( data ) {
			data_dict[comparison] = data;
			generate_tables(data_dict[current_file]);
			data = '';
		});
	}
}
function generate_tables( em_json, core ) {
	cell_type_colors(em_json);
	cell_type_nt(em_json);
	var keys = Object.keys(em_json);
	var len;
	i, len = keys.length;
	keys.sort();
	var cell_select = generate_cell_select(keys);
	var myhtml = "<ul class='nav nav-tabs'> <li class='active'> <a href='#tab1' data-toggle='tab'>Input/Output</a> </li><li><a href='#tab2' data-toggle='tab'>Core Connectome</a></li></ul>";
	myhtml += "<div class='tab-content'><div class='tab-pane active' id='tab1'>";
	myhtml += cell_select;
	for (var i = 0; i < len; i++){
		cell_type = keys[i];
		if (em_json.hasOwnProperty(cell_type)) {
			myhtml += "<div class='cell_tables "+cell_type+"'>";
			myhtml += "<h2 style='color:"+color_dict[cell_type]+"'><a name='"+cell_type+"'></a>"+cell_type+"</h2>";
			if ( ! $.isEmptyObject(em_json[cell_type].cells)){
				myhtml += "<div class='in'>";
				myhtml += "<h3>Inputs</h3>";
				myhtml += "<h4>Input Connections by Cell Type</h4>";
				myhtml += connections_table(em_json[cell_type].inputs, Object.keys(em_json[cell_type].cells).length, 'inputs', cell_type);
				myhtml += connections_count(em_json[cell_type], 'inputs', cell_type);
				myhtml += "</div>";
				myhtml += "<div class='out'>";
				myhtml += "<h3>Outputs</h3>";
				myhtml += "<h4>Output Connections by Cell Type</h4>";
				myhtml += connections_table(em_json[cell_type].outputs, Object.keys(em_json[cell_type].cells).length, 'outputs', cell_type);
				myhtml += connections_count(em_json[cell_type], 'outputs', cell_type);
				myhtml += "</div>";
			}
			else {
				myhtml += "<h3>No data</h3>";
			}
			myhtml += "</div>";
		}
	}
	myhtml += "</div>";
	myhtml += "<div class='tab-pane' id='tab2'>";
	myhtml += core_table(core);
	myhtml += "</div></div>";
	$('#em_table').append(myhtml);
	$('#inputs').button('toggle');
	$('#outputs').button('toggle');
}
function connections_count(json_in, i_o, cell_name) {
        var for_all_cells = json_in[i_o].named;
	var cell_types = Object.keys(for_all_cells).sort( function( a, b ) {
                        if (a == 'Unknown') return 1;
                        if (b == 'Unknown') return -1;
                        return ss.sum(for_all_cells[b]) - ss.sum(for_all_cells[a]);
	}); 
	var my_html = "";
        my_html = "<br><p>Strength of each connection for cells of Type " + cell_name + " in order</p>";
	my_html += "<table><thead><tr><th>Cell</th>";
	cell_types.forEach( function(c) {
		my_html += "<th>" + c + "</th>";
	});
	my_html += "</tr></thead><tbody>";
        cells = json_in.cells;
        Object.keys(cells).forEach( function(body_id) {
		my_html += "<tr><th>" +json_in.cells[body_id].name+ "</th>"; 
		cell_types.forEach( function(c) {
			if (c in json_in.cells[body_id][i_o + "_by_type"]) 
				my_html += "<td>" + json_in.cells[body_id][i_o + "_by_type"][c].sort(numerical_sort).reverse().join(", ") + "</td>";
			else
				my_html += "<td></td>";
		});
		my_html += "</tr>";
        });
	my_html += "</tbody></table>";
	return my_html;
}
function numerical_sort(a, b){
	return a - b;
}
function core_table(core){
	var keys = Object.keys(core);
	keys.sort();
	var core_select = "<div class='form-inline'><label for='from_core'>From:<select id='from_core'>";
	keys.forEach( function(k) {
		core_select += "<option value='" + k + "'>" + k + "</option>";
	});
	core_select += "</select>";
	core_select += "<label for='to_core'>To:<select id='to_core'>";
	keys.forEach( function(k) {
		core_select += "<option value='" + k + "'>" + k + "</option>";
	});
	core_select += "</select>";
	core_select += "<button class='btn' onclick='display_core();'>Submit</button>";
	core_select += "</div>";
	core_select += "<div id='core_table'></div>";
	return core_select;
}
function display_core() {
	var from_cell = $('#from_core').val();
	var to_cell = $('#to_core').val();
	var core_table = core[from_cell][to_cell];
	var col_order = ['H', 'a', 'b', 'c', 'd', 'e', 'f'];
	var my_html = "";
	my_html += "<p><b>Core Connectome</b> For each of the seven columns (H and a-f) The number of synapses that are pre-synaptic in the cell of the row and post-synaptic to the cell in the appropriate column (left) and the surface area overlap of the two cells (right).</p>"
	my_html += "<table class='cross_table'><caption>Connection Count</caption><thead>";
	my_html += "<tr><td colspan=2 class='noborder'></td><td colspan=7 class='table_label'>Postsynaptic " + to_cell + "</td></tr>";
	my_html += "<tr><th></th><th></th>";
	col_order.forEach( function(i) {
		my_html += "<th>" + i + "</th>";
	});
	my_html += "</tr>";
	my_html += "</thead><tbody>";
	for (var i = 0; i < 7; i++) {
		my_html += "<tr>";
		if (i == 0) my_html += "<td class='table_label' rowspan=7><div class='rotate'>Presynaptic " + from_cell + "</div></td>";
		my_html += "<th>" + col_order[i] + "</th>";
		for (var j = 0; j < 7; j++) {
			var cell_class = (i == j)? 'diagonal' :
				(core_table['count'][i][j] > 0)? 'interesting' : ''; 
			my_html += "<td class='" + cell_class + "'>" + core_table['count'][i][j] + "</td>";
		}
		my_html += "</tr>";
	}
	my_html += "</table>";	
	my_html += "<table class='cross_table'><caption>Surface Area Overlap (microns)</caption><thead>";
	my_html += "<tr><td colspan=2 class='noborder'></td><td colspan=7 class='table_label'>Postsynaptic " + to_cell + "</td></tr>";
	my_html += "<tr><th></th><th></th>";
	col_order.forEach( function(i) {
		my_html += "<th>" + i + "</th>";
	});
	my_html += "</tr>";
	my_html += "</thead><tbody>";
	for (var i = 0; i < 7; i++) {
		my_html += "<tr>";
		if (i == 0) my_html += "<td class='table_label' rowspan=7><div class='rotate'>Presynaptic " + from_cell + "</div></td>";
		my_html += "<th>" + col_order[i] + "</th>";
		for (var j = 0; j < 7; j++) {
			var cell_class = (i == j)? 'diagonal' :
				(core_table['overlap'][i][j] > 0)? 'interesting' : ''; 
			my_html += "<td class='" + cell_class + "'>" + core_table['overlap'][i][j] + "</td>";
		}
		my_html += "</tr>";
	}
	my_html += "</table>";	
	$('#core_table').html(my_html);
}

function calc_comparison_badge(newv, compv) {
	var diff = newv - compv;
	if (! isInt(diff)) diff = diff.toFixed(1);	
	if (diff > 0) {
		return '<span class="badge badge-more">+' + diff + '</span>';
	}
	else if (diff < 0 ) {
		return '<span class="badge badge-less">' + diff + '</span>';
	}
	return '';
}

function isInt(n) {
	return n % 1 === 0;
}



function generate_cell_select(cell_types) {
	var select = "<div class='form-inline'> <label for='type_select'>Cell Type </label><select name='type_select' id='type_select' onchange='show_table(this.value)'><option value='all'>All Types</option>";
	cell_types.forEach( function(c) { select += "<option value='" + c + "'>" + c + "</option>"; } );
	select += "</select>";
	select += "<div class='btn-group' data-toggle='buttons-checkbox'>";
	select += "<button type='button' onclick='$(\".in\").toggle()' id='inputs' class='btn'>Inputs</button>";
	select += "<button type='button' onclick='$(\".out\").toggle()' id='outputs' class='btn'>Outputs</button>";
	select += "</div></div>";
	return select;
}
function show_table(cell_type){
	$('.cell_tables').hide();
	if (cell_type == 'all') $('.cell_tables').show();
	$('.'+cell_type).show();
}

function connections_table( json_in, instances, inputs_or_outputs ) {
	var table = "<table class='tablesorter'>";
	table += "<thead><tr><th>Cell Type</th>";
	nt_header = (inputs_or_outputs == 'inputs')? "<th>Trans</th>" : "<th>Receptors</th>";
	table += nt_header;
	table += "<th>Count</th><th>Per Inst.</th><th>Mean</th><th>Conn per Inst.</th><th>StDev</th><th>Dev as % of Mean</th><th>Total %</th></tr></thead><tbody>";
	var keysSorted = Object.keys(json_in.named).sort( function( a, b ) {
			if (a == 'Unknown') return 1;
			if (b == 'Unknown') return -1;
			return (json_in.named[b].length/instances)*ss.mean(json_in.named[b]) - (json_in.named[a].length/instances)*ss.mean(json_in.named[a]);
		});
	var total_conn = json_in.total;
	keysSorted.forEach( function(cell) {
		//named connections
		var count = json_in.cpi_stats[cell].named.count;
		var per_inst = json_in.cpi_stats[cell].named.per_instance;
		var mean = json_in.cpi_stats[cell].named.mean;
		var stdev = json_in.cpi_stats[cell].named.stdev;
		var sum = json_in.cpi_stats[cell].named.sum; 
		var conn_per_inst = json_in.cpi_stats[cell].named.cpi;
		var stdev_percentage = (stdev/mean) * 100;
		var total_percentage = (sum/total_conn) * 100;
		var bg = which_cell_color(cell);
		var txt = which_text_color(bg);
		var count_badge = ''
		var per_inst_badge = '';
		var mean_badge = '';
		var cpi_badge = '';
		var stdev_badge = ''
		if (comparison) {
			if (cell_type in data_dict[comparison] && cell in data_dict[comparison][cell_type][inputs_or_outputs].cpi_stats) {
				var comp = data_dict[comparison][cell_type][inputs_or_outputs].cpi_stats[cell];
				count_badge = calc_comparison_badge(count, comp['7col'].count);
				per_inst_badge = calc_comparison_badge(per_inst, comp['7col'].per_instance);
				mean_badge = calc_comparison_badge(mean, comp['7col'].mean);
				cpi_badge = calc_comparison_badge(conn_per_inst, comp['7col'].cpi);
				stdev_badge = calc_comparison_badge(stdev, comp['7col'].stdev);
			}
		}
		var nt;
		if (cell in nt_dict) { 
			nt = (inputs_or_outputs == 'inputs')? nt_dict[cell].transmitter : nt_dict[cell].receptor;
		}
		if (!nt) nt = '?';
		var conn_per_inst_class = (conn_per_inst >= 5)? 'good':
						(conn_per_inst <= 1)? 'bad' : '';
		table += "<tr><th style='background-color:" + bg + "; color:" + txt + "'>" + cell + "</th>";
		table += "<td>" + nt + "</td>";
		table += "<td>" + count_badge + count + "</td>";
		table += "<td>" + per_inst_badge + per_inst.toFixed(1) + "</td>";		
		table += "<td>" + mean_badge + mean.toFixed(1) + "</td>";
		table += "<td class='" + conn_per_inst_class + "'>" + cpi_badge + conn_per_inst.toFixed(1) + "</td>";
		table += "<td>" + stdev_badge + stdev.toFixed(1) + "</td>"
		table += "<td>" + stdev_percentage.toFixed(1) + "%</td>"
		table += "<td>" + total_percentage.toFixed(1) + "%</td>"
		table += "</tr>";
	});
	table += "</tbody></table>";
	var caption = "<p>All connections between cell types, " + total_conn + " total connections on " + instances + " instances. ";
	var cell_type_nt; 
	if ( cell_type in nt_dict ) {
		if ( inputs_or_outputs == 'inputs') {
			cell_type_nt = nt_dict[cell_type].receptor;
			if (!cell_type_nt) cell_type_nt = '?';
			caption +=  "Cells of type " + cell_type + " have receptors for (at least) " + cell_type_nt;
		}
		else {
			cell_type_nt = nt_dict[cell_type].transmitter;
			if (!cell_type_nt) cell_type_nt = '?';
			caption +=  "Cells of type " + cell_type + " use neurotransmitter " + cell_type_nt;
		}
	}
	caption += "</p>";
	table = caption + table;
	return table;
}

function which_cell_color(cell_type) {
	if (color_dict[cell_type]){
		return color_dict[cell_type];
	}
	return '#ffffff';
}
function which_text_color(bg_color){
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(bg_color);
	var rgb = result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
	if (rgb) {
		var lum = 1 - ( 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b)/255;
		if (lum > .5) return "#dddddd";
	}
	return "#000000";
}

function cell_type_colors(em_json) {
	for (var cell_type in em_json ){
		if (em_json.hasOwnProperty(cell_type)) {
			color_dict[cell_type] = em_json[cell_type].stats.color;
		}
	}
}

function cell_type_nt(em_json) {
	for (var cell_type in em_json ){
		if (em_json.hasOwnProperty(cell_type)) {
			nt_dict[cell_type] = em_json[cell_type].stats.neurotransmitter;
		}
	}
}


$(function() {
	var data = JSON.parse($('#table_json').text());
	d = data;
	core = JSON.parse($('#core_json').text());
	generate_tables(data, core);
	//json_data_from_file('js/em_tables.json');
//	json_data_from_file('js/em_table_export_20140502.json');

});
