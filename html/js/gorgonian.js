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
	$.when( $.ajax('http://hackathon.janelia.org/api/node/2a3/gorgonian/all_em_inputs.json' ), $.ajax('http://hackathon.janelia.org/api/node/2a3/gorgonian/names_autocomplete.txt')).done(function( a1, a2 ) {
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
//cell_names = [
//"out-462669", "Tm25/Y1a", "Tm25/Y1e", "Tm25/Y1d", "L1p3", "tan-28574", "out-232742", "T3 H", "Dm5-like-1", "T1q4", "out-270511", "Dm12-2", "R7j9", "out-7519", "Mi15a", "Mi15c", "Mi15b", "Mi15e", "Mi15d", "Mi15f", "L4k10", "Tm-35611", "out-349217", "Mi9e", "Mi9d", "Mi9f", "Mi9a", "Mi9c", "Mi9b", "out-232638", "Tm23/24f", "Tm3i8-A", "Tm-8499", "out-232738", "C2d", "out-192614", "Tm-22490", "T2(a) H", "Mi1p3", "Dm2k10", "Tm-14349", "Tm-94220", "TmY3q4", "tan-445636", "Dm-14398", "Tm-544949", "tan-313015", "out-211490", "Tm28", "Tm3-A", "TmY10-like-0", "TmY10-like-1", "Mi9 H", "Tm3p3-P", "out-35730", "Tm2f", "Tm2e", "Tm2d", "Tm2c", "Tm2b", "Tm2a", "Tm4-A", "Dm-28715", "TmY9-like-1", "TmY9-like-0", "TmY9-like-3", "TmY9-like-2", "Tm4d-A", "Tm-14433", "tan-252012", "out-682821", "L4c", "L4b", "R8 H", "Dm12-1", "Dm12-0", "L4e", "L4d", "TmY13-like", "Dm15-3", "Dm15-0", "Dm15-1", "Dm15-4", "L3f", "L3d", "L3e", "L3b", "L3c", "L3a", "L2q4", "Mi1k10", "TmY5(a)e", "TmY5(a)d", "TmY5(a)f", "Tm1q4", "L4f", "ukTmY-1p3", "T3f", "tan-603420", "T3d", "T3e", "T3b", "T3c", "T3a", "out-289371", "out-250396", "out-460398", "Dm11-2", "Dm11-0", "Dm11-1", "R7a", "R7b", "R7c", "R7d", "R7e", "R7f", "Mi4n1", "out-376718", "out-493166", "Mi4f", "Mi4d", "Mi4e", "Mi4b", "Mi4c", "Mi4a", "R7l11", "T2(a)d-2nd", "Tm1p3", "tan-192082", "out-252546", "L2 H", "tan-600936", "Tm16-like-0", "Tm16-like-1", "Tm16-like-2", "Tm3c-A", "out-248932", "out-1824", "Tm5Y H", "Tm-383520", "L4", "Tm1k10", "out-139208", "tan-307683", "tan-373538", "Mt7-like", "Tm2k10", "tan-88816", "out-235530", "Tm5Ye", "Dm7-like", "Mi1o2", "Tm5(a)k10", "Mi1e", "Mi1d", "Mi1f", "Mi1a", "Mi1c", "Mi1b", "Dm9-3", "L5p3", "TmY3f", "Dm7-0", "TmY3e", "C3e", "C3d", "Dm10-1", "C3f", "C3a", "C3c", "C3b", "tan-319054", "out-247146", "out-245367", "tan-192522", "L2r5", "T2k10", "R7 H", "tan-342393", "Dm8b/H", "tan-226033", "Tm-252648", "Tm4c-A", "Mt8-like", "Mi4p3", "Dm14-like", "T2 H", "Tm5(a)j9", "Tm23/24", "Tm1b", "Tm1c", "tan-88364", "Tm1a", "Tm1f", "out-54028", "Tm1d", "Tm1e", "Mi9o2", "R8q4", "Tm-88847", "Tm29-4", "out-245275", "L3p3", "Mi9q4", "out-24372", "out-244999", "tan-198515", "Dm2 H", "Tm-544957", "tan-601412", "Tm5Yd", "Dm-24078", "Tm5Yf", "Tm5Ya", "Tm5(a)l11", "Mi1o2p3", "tan-663722", "out-16417", "cell body", "Dm8outside", "out-139663", "T3l11", "T3q4", "out-316505", "Dm6-3", "Dm6-2", "Dm6-1", "Dm6-0", "Dm6-5", "Dm6-4", "Dm4-5", "Dm4-7", "Dm4-6", "Dm4-1", "Mi1j9", "Dm4-3", "Dm4-2", "Mi13-3", "Mi13-2", "Mi13-1", "Mi13-0", "Mi10-0", "Mi10-1", "Mi10-2", "Tm2q4", "Dm7-1", "tan-307668", "C2 H", "Y4?", "Tm-577399", "Tm25/Y1 H", "L1r5", "Dm3-cf1", "Dm3-cf0", "Dm3-cf3", "Dm3-cf2", "Dm3-cf4", "Mi-603788", "Dm3-ad4", "Mi9k10", "Dm1-0", "Dm1-1", "Dm1-2", "Dm3-ad2", "T4-3", "T4-2", "T4-1", "out-238805", "out-617454", "T4-4", "Mi1p3q4", "T2(a)c", "T2(a)a", "T2(a)f", "T2(a)d", "T2(a)e", "T2j9", "Dm-35770", "Dm4-0", "L5a", "L5b", "Tm4k10-A", "L5d", "L5e", "L5f", "Dm3-be1", "Dm3-be0", "Dm3-be3", "Dm3-be2", "Dm3-be5", "Dm3-be4", "TmY5(a) H", "Dm3-be6", "Tm9d", "tan-602477", "out-275282", "Mi1m12", "Tm8/22", "Tm5(b)b", "Tm5(b)c", "Tm5(b)d", "Tm5(b)e", "Tm5(b)f", "Tm1o2", "Mi4l11", "C2b", "C2c", "C2a", "C2f", "Dm1-like-2", "Dm1-like-1", "C2e", "out-251842", "out-302000", "Tm5(a)c", "Tm5(a)a", "Tm5(a)f", "Tm5(a)e", "C2q4", "Tm1p3q4", "Mi1n1", "Tm-17236", "tan-308956", "Dm8j9", "Mi4k10", "Tm20d", "Tm3d-P", "Tm9c", "Dm9-5", "Dm9-0", "Dm9-1", "Dm9-2", "Tm20 H", "tan-2796", "Dm8e", "Dm8d", "Dm8f", "Dm8a", "Pm1(a)-Mi1Tm3", "Dm8c", "Dm6-like", "Tm9e", "Tm29-3", "Tm29-2", "Tm29-1", "Tm29-0", "out-236000", "out-251820", "Tm1l11", "tan-371414", "Mi-82089", "L4j9", "Pm-373651", "tan-226040", "Tm9b", "Tm20e", "Tm20f", "Tm9a", "Tm9f", "Tm20a", "Tm20b", "Tm20c", "T1d", "T1e", "T1f", "T1a", "T1b", "T1c", "Tm5(b) H", "Y3/Y6", "L1d", "L1e", "L1f", "L1a", "L1b", "L1c", "Mi1l11", "R7q4", "C3q4", "Tm3j9-A", "Tm-280615", "R8p3", "Tm5Yq4", "Tm2l11", "Mt5", "Dm8q4", "Dm2e", "Dm2c", "Dm2b", "Dm2a", "Pm1(a)-Tm1only", "ukTmY-1o2", "out-394547", "out-273118", "L1l11", "Mi9p3", "Mi4q4", "Pm4-8", "tan-251072", "Pm3-2", "L5 H", "Pm3-0", "Pm3-1", "Pm4-1", "Pm4-0", "Pm4-3", "Pm4-2", "Pm4-5", "Pm4-4", "Pm4-7", "Pm4-6", "Dm13-like", "Tm3e-A", "tan-90603", "Tm9 H", "Tm3e-P", "Tm2 H", "T2(a)k10", "T3p3", "T3p3q4", "Tm3b-A", "Dm8k10", "Tm3a-A", "Tm3b-P", "Tm3a-P", "tan-17967", "out-467977", "T2outside", "tan-603392", "TmY3 H", "TmY3d", "out-493505", "tan-648011", "tan-217346", "Tm2p3", "Dm10-3", "Mi4o2", "Dm10-2", "Tm9p3", "Dm10-0", "tan-603405", "Dm10-5", "Tm-11777", "Dm3-ad1", "L1q4", "Dm10-4", "Mi1 H", "Dm3-ad0", "tan-245613", "Dm3-ad3", "C3 H", "Tm6/14-1", "Dm1-3", "tan-319754", "Pm-399237", "TmY11-like", "Tm2o2", "Dm-13852", "Dm-13858", "Dm2p3", "tan-382897", "R8a", "R8c", "R8b", "R8e", "R8d", "R8f", "Mi2-2", "tan-373099", "Mi2-0", "Mi2-1", "T2(a)q4", "T2(a)b", "out-320885", "out-272900", "tan-170727", "Tm3k10-A", "Pm2-3", "Pm2-2", "Pm2-1", "Pm2-0", "Pm2-7", "Pm2-6", "Pm2-5", "Pm2-4", "Pm2-9", "Pm2-8", "Tm4-", "Mi14", "tan-251395", "Tm6/14-0", "Mi1q4", "Tm6/14-2", "Tm6/14-3", "Tm6/14-4", "Tm6/14-5", "Mi4 H", "Dm2f", "out-245293", "L4a", "R7k10", "out-327705", "tan-158571", "T2p3", "out-532839", "Tm1 H", "out-372678", "T2(a)j9", "Dm12-3", "T2a", "T2c", "T2b", "T2e", "T2d", "T2f", "Dm15-2", "ukTmY-1?", "out-137973", "out-311748", "Dm5-like-3", "Dm5-like-2", "tan-314451", "T4", "ukTmY-1e", "ukTmY-1f", "ukTmY-1a", "ukTmY-1c", "Tm-273293", "L2p3", "Tm-31602", "L1 H", "L5c", "Tm-582680", "Tm3-out", "out-247296", "L1k10", "Pm4-9", "L3 H", "Pm1", "tan-564888", "R7p3", "Tm-372847", "Dm3-be7", "TmY4-like-4", "TmY4-like-2", "TmY4-like-3", "TmY4-like-0", "TmY4-like-1", "ukTmY-1l11", "glia", "Dm17-like-2", "Dm17-like-1", "L2a", "L2c", "L2b", "L2e", "L2d", "L2f", "Mi9p3q4", "L5l11", "Mi4p3q4", "out-380698", "tan-255257", "Lawf2-0", "Lawf2-1", "Mi9l11", "Tm-3438", "Tm5(c)-1", "Tm5(c)-0", "Tm5(c)-3", "Tm5(c)-2", "L4 H", "Lawf1-2", "Lawf1-1", "Lawf1-0", "out-469037", "Tm4f-P", "T1", "Tm4a-A", "Tm4f-A", "Tm-14564", "Tm4e-A", "L5q4"
//];
	function initGorgonian() {
		label_search = $('#label_search').magicSuggest({
			data: cell_names,
			width: 600,
		});
		$(label_search).on('keyup', function() { highlightMatches() });
		$(label_search).on('selectionchange', function() { highlightMatches() });
	}

});
