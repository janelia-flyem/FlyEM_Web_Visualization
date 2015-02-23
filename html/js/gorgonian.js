// Add a method to the graph model that returns an
// object with every neighbors of a node inside:
var edgeWeight = 5;
var maxEdgeWeight = 50;
var insearch = false;
var selected_nodes = [];
var dblclk = false;
var snglclk = false;
var syn_exists = false;
var label_search;
var colors = [
	'#b705bd',
	'#0649c7',
	'#04b03b',
	'#c78606',
	'#bd4608',
	'#bd1402',
	'#4f03c7',
	'#07a1b0',
	'#47c703',
	'#bd860b',
	'#e3088d',
	'#0c3fed',
	'#00d661',
	'#ede406',
	'#e36004',
	'#e31803',
	'#5e03ed',
	'#08c4d6',
	'#55ed03',
	'#e3a20d',
];
$(function() {
	var em_inputs;
	var cell_names;
	var win_width = $(window).width();
	var win_height = $(window).height();
	var canvas_height = Math.max( win_height - 250, 500 );
	$('#gorgonian').width( Math.max(Math.floor( win_width * 0.55 ), 400) );
	$('#gorgonian').height(canvas_height);
	$.when( $.ajax('http://emdata1.int.janelia.org/api/node/2a3/gorgonian/all_em_inputs.json' ), $.ajax('http://emdata1.int.janelia.org/api/node/2a3/gorgonian/names_autocomplete.txt')).done(function( a1, a2 ) {
			em_inputs = $.parseJSON(a1[0]);
			cell_names = $.parseJSON(a2[0]);
			loadGraph();
			initGorgonian();
               });
	sigma.classes.graph.addMethod('neighbors', function(nodeId) {
		var k,
		neighbors = {},
		index = this.allNeighborsIndex[nodeId] || {};
		for (k in index){
			for (f in index[k]) { 
				if (index[k][f].size >= edgeWeight) neighbors[k] = this.nodesIndex[k];
			}
		}
		return neighbors;
	});

	function colorNeighbors(node_id, color, secondary) {
		var node_color = shadeColor2(color, -0.4);
		var neighbor_color = shadeColor2(color, 0.2);
		var neighbor2_color = shadeColor2(color, 0.7);
		var edge_color = shadeColor2(color, -0.2);
		var edge2_color = shadeColor2(color, 0.7);
		var nneighbors = sig.graph.neighbors(node_id);
		
		sig.graph.nodes().forEach(function(a) {
			if (a.id == node_id) {
			    a.color = node_color;
			}		 
			else if (nneighbors[a.id]){
			    a.color = neighbor_color;
			} 
		});	
		sig.graph.edges().forEach(function(e) {
			if ((nneighbors[e.source] && e.target == node_id) || (e.source == node_id && nneighbors[e.target])) e.color = edge_color;
		});
		if (secondary == true){
			$.each(nneighbors, function(k,v) {
				var neighbors2nd = sig.graph.neighbors(k);
				sig.graph.nodes().forEach(function(z) {
					if (neighbors2nd[z.id] && z.color == '#eee'){
						 z.color = neighbor2_color;
					}
				});
				sig.graph.edges().forEach(function(e) {
					if (((nneighbors[e.source] && neighbors2nd[e.target]) || (neighbors2nd[e.source] && nneighbors[e.target])) && e.color == '#eee') {
						e.color = edge2_color;
					}
				});
			});
		}
	}
	function synapseCenter(node_id, color) {
		var nneighbors = sig.graph.neighbors(node_id);
		var locations_ar = [];
		sig.graph.nodes().forEach(function(n) {
			if (nneighbors[n.id]){
				locations_ar.push([n.x, n.y]);
			}
		});
		if (locations_ar.length == 0) return;
		l = aveLocation(locations_ar);
		sig.graph.addNode({'id':'syn', 'label':'synapse center', 'type':'cross', 'size': 20, 'x':l[0], 'y': l[1], 'color': color, 'borderColor': shadeColor2(color, -0.4), 'cross':{'lineWeight':1}});
		syn_exists = true;

	}
	function clearGraph() {
		sig.graph.nodes().forEach(function(a){ a.color = '#eee';});
		sig.graph.edges().forEach(function(a){ a.color = '#eee';});
		if (syn_exists){
			sig.graph.dropNode('syn');
			syn_exists = false;
		}
	}
	function resetGraph() {
		insearch = false;
		snglclk = false;
		selected_nodes = [];
		sig.graph.nodes().forEach(function(n) { n.color = n.originalColor; });
		sig.graph.edges().forEach(function(e) { e.color = e.originalColor; });
		if (syn_exists){
			sig.graph.dropNode('syn');
			syn_exists = false;
		}
	}
	function convertPlane(mode) {
		var x, y;
		if (mode === 'xy') {
			x = 0;
			y = 1;
		}
		else if (mode === 'yz') {
			x = 1;
			y = 2;
		}
		else if (mode === 'xz') {
			x = 0;
			y = 2;
		}
		else {
			console.log("Unsupported mode: ", mode);
			return;
		}
		sig.graph.nodes().forEach(function(n) {
			if (n.location){
				n.x = n.location[x];
				n.y = n.location[y];
			}
		});
		sig.refresh();
	}
	var sig;
	function loadGraph() {
		sig = new sigma({
			graph: em_inputs, 
			renderer: {
				container: document.getElementById('gorgonian'),
				type: 'canvas',
			},
			settings: {
				defaultNodeColor: '#55aaff',
				defaultEdgeColor: '#114599',
				edgeColor: 'default',
				doubleClickEnabled: false,
				maxEdgeSize: 5,
			},
		});
		// We first need to save the original colors of our
		// nodes and edges, like this:
		sig.graph.nodes().forEach(function(n) {
			n.originalColor = n.color;
		});
		sig.graph.edges().forEach(function(e) {
			e.originalColor = e.color;
			if (parseInt(e.size) > maxEdgeWeight) maxEdgeWeight = parseInt(e.size);
	//		e.type = 'arrow';
		});

		// When a node is clicked, we check for each node
		// if it is a neighbor of the clicked one. If not,
		// we set its color as grey, and else, it takes its
		// original color.
		// We do the same for the edges, and we only keep
		// edges that have both extremities colored.
		sig.bind('clickNode', function(e) {
			if (dblclk){
				dblclk = false;
				return;
			}
			snglclk = true;
			var nodeId = e.data.node.id;
			selected_nodes = [nodeId];
			clearGraph()
			var set_color = colors[Math.floor(Math.random()*colors.length)];
			colorNeighbors(nodeId, set_color, false);
			synapseCenter(nodeId, set_color);
			sig.refresh();
		});
			
		sig.bind('doubleClickNode', function(e) {
			dblclk = true;
			snglclk = false;
			var nodeId = e.data.node.id;
			selected_nodes = [nodeId];
			clearGraph()
			var set_color = colors[Math.floor(Math.random()*colors.length)];
			colorNeighbors(nodeId, set_color, true);
			synapseCenter(nodeId, set_color);
			sig.refresh();
		});


		// When the stage is clicked, we just color each
		// node and edge with its original color.
		sig.bind('clickStage', function(e) {
			resetGraph();
			s.refresh();
		});
		sig.refresh();
		$('#edgefilter').attr('max',  maxEdgeWeight);
		$('#edgefilter').change();
		
	}

	$('#edgefilter').change( function() {
		//resetGraph();
		edgeWeight = parseInt($('#edgefilter').val());
		$('#edgeval').html(edgeWeight);
		sig.graph.edges().forEach( function(e) {
			if (e.size >= edgeWeight) e.hidden = false;
			else e.hidden = true;
		});
		if (selected_nodes.length > 0 ) clearGraph();
		var color_set = colors.slice(0);
		var set_color;
		selected_nodes.forEach( function(n) {
			var scnd = true;
			if (color_set.length != 0) set_color = color_set.pop();
			else set_color = '#55aaff';
			if (snglclk) scnd = false;
			colorNeighbors(n, set_color, scnd);
		});
		if (selected_nodes.length == 1){
			synapseCenter(selected_nodes[0], set_color);
		}
		sig.refresh();
	});
	$('#label_submit').click(
		function(e) {
			snglclk = false;
			$('#shark').html('');
			var node_list = []
			if (label_search.getRawValue() != ""){
				//search_array.push( label_search.getRawValue() );
				var raw_val = label_search.getRawValue().trim();
				label_search.addToSelection({'id':raw_val, 'name':raw_val}, true);
			}
			var search_array = label_search.getValue();
			if (search_array == []) return;
			regex_array = searchArrayCreator(search_array);
			regex_array.forEach( function(regex) {
				sig.graph.nodes().forEach( function(n) { 
					if (n.label.match(new RegExp(regex, "i"))){
						node_list.push(n.id);
					}
					else if (n.id.match(new RegExp(regex, "i"))){
						node_list.push(n.id);
					}
				});
			});
			selected_nodes = node_list.slice(0);
			clearGraph();
			var color_set = colors.slice(0);
			var set_color;
			node_list.forEach( function(n) {
				if (color_set.length != 0) set_color = color_set.pop();
				else set_color = '#55aaff';
				colorNeighbors(n, set_color, true);
			});
			if (node_list.length == 1) synapseCenter(node_list[0], set_color);
			sig.refresh();
		}
	 );
	$('#shark_viewer').click(
		function(e) {
			if (selected_nodes.length == 0){
				alert("Please select 1 or more nodes to view in SharkViewer");
				return;
			}
			$('#ajax_span').show();
			var currently_selected = selected_nodes.slice(0);
			var nodes_for_shark = currently_selected.slice(0);
			if ($('#neighbors').is(':checked')){
				currently_selected.forEach(function(c){
					Object.keys(sig.graph.neighbors(c)).forEach(function(n){ nodes_for_shark.push(n)});
				});
			}
			console.log(nodes_for_shark);
			$.post( "gorgonian_ajax.php",
				{'bodies': nodes_for_shark, 'download': false},
				function(data) {
					//metadata = data.replace("/","/metadata/");
					//metadata = metadata.replace(".swc",".json");
					if (data.match('Failure')) {
						if (! ($('#skel_fail').length)) $('#gorgonian').prepend('<div id="skel_fail" class="alert alert-error"> <button type="button" class="close" data-dismiss="alert">&times;</button> <strong>Warning!</strong> Skeletonization failed. </div>');
					}
					else {
					//	window.open("http://informatics-prod.int.janelia.org/Shark_Viewer.php?swc_file="+data+"&mode=particle&effect=noeffect&metadata_file="+metadata, 'neuron', 'location=1,menubar=1,scrollbars=1,status=1,titlebar=1');
						initSharkViewer(data);
					}
					$('#ajax_span').hide();
				}
			);

		}
	);
	$('#xy').click( function() {
		convertPlane('xy');
	});
	$('#yz').click( function() {
		convertPlane('yz');
	});
	$('#xz').click( function() {
		convertPlane('xz');
	});
	$('#xy').button('toggle');
	function highlightMatches() {
		insearch = true;
		var search_array = label_search.getValue();
		if (label_search.getRawValue() != "") search_array.push( label_search.getRawValue() );
		if (search_array == []) return;
		resetGraph();
		reg_array = searchArrayCreator(search_array);
		reg_array.forEach( function(regex) {
			sig.graph.nodes().forEach( function(n) { 
				if (n.label.match(new RegExp(regex, "i"))){
					n.color = "#ffff00";
				}
			});
		});
		sig.refresh();
	}
	function aveLocation(locations) {
		var num_locations = locations.length;
		if (num_locations == 0) return [0, 0];
		var sum = [0,0];
		locations.map(function(l){
			sum[0] += l[0];
			sum[1] += l[1];
		});
		
		return sum.map(function(x){ return parseInt(x/num_locations) });
	}

	function shadeColor2(color, percent) {   
	    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
	    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
	}
	
	function searchArrayCreator(sa) {
		var reg_ar = [];
		sa.forEach( function(s) {
			//if name we want to match from the begining 
			if (isNaN(s)) {
				regex = s.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
				regex = "^" + regex;
				reg_ar.push( regex );
			}
			//if body id, we want to match the whole body id, not just from the begining
			else {
				regex = "^" + s + "$";
				reg_ar.push( regex );
			}
		});
		return reg_ar;
	}


	function initSharkViewer(swc_json) {
		console.log(swc_json);
		$('#shark').html('');
		var swc_value = JSON.parse(swc_json);
		var swc = swc_value.data;
		var meta = swc_value.metadata;
		var shark_width = Math.max(Math.floor(win_width * 0.4), 300);
		$('#shark').width(shark_width);
		var s = new SharkViewer({swc: swc, colors: colors, dom_element: 'shark', center_node: -1, WIDTH: shark_width, HEIGHT: canvas_height, metadata: meta });
		s.init();
		s.animate();
		$('#shark').prepend("<a class='btn swc_button' download href='" + swc_value.filename +"'>Download swc file<span class='glyphicon glyphicon-download'></span></a>");
	}
	function initGorgonian() {
		label_search = $('#label_search').magicSuggest({
			data: cell_names,
			width: 600,
		});
		$(label_search).on('keyup', function() { highlightMatches() });
		$(label_search).on('selectionchange', function() { highlightMatches() });
	}

});
