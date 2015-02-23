import re
import json
import sys
import os
import operator
import argparse 
import numpy as np
import urllib2 as url
import functions_common as fc
import httplib
import json
from pydvid import keyvalue as kv
from pydvid import general

#Constants
YELLOW_COLUMNS = ['A', 'C', 'E', 'F']
#create cell types
CATEGORIES = [ 
     ["R7",     '#990033', 21],
     ["R8",     '#CC3366', 17],
     ["C2",     '#FF9966',  5],
     ["C3",     '#CC6633',  9],
     ["T1",     '#99CCFF', 11],
     ["T2(a)",  '#6699CC',  6],   
     ["T2",     '#336699', 13],
     ["T3",     '#3399FF'    ],
     ["T4",     '#0066CC',  2],
     ["Mi10",   '#CCFFCC'    ],  
     ["Mi13",   '#99FF99'    ],
     ["Mi14",   '#99CC66'    ],
     ["Mi15",   '#66FF66', 26],
     ["Mi1",    '#669966',  1],
     ["Mi2",    '#339933'    ],
     ["Mi4",    '#33CC33', 19],
     ["Mi9",    '#00FF00', 20],
     ["Tm16",   '#CCFFFF'    ],
     ["Tm19",   '#99CCCC'    ],
     ["Tm20",   '#669999', 22],
     ["Tm23",   '#336666'    ],
     ["Tm25",   '#99FFFF'    ],
     ["Tm1",    '#66CCCC',  8],
     ["Tm2",    '#339999', 10],
     ["Tm3",    '#006666',  3],
     ["Tm4",    '#66FFFF', 12],
     ["Tm5Y",   '#33CCCC'    ], 
     ["Tm5(a)", '#009999'    ],
     ["Tm5(b)", '#33FFFF'    ], 
     ["Tm5(c)", '#00CCCC'    ], 
     ["Tm6",    '#00FFFF', 16],
     ["Tm9",    '#003333', 24], 
     ["L1",     '#9999FF',  0],
     ["L2",     '#6666FF',  7],
     ["L3",     '#3333FF', 18],
     ["L4",     '#6666CC', 14],
     ["L5",     '#3333CC',  4],
     ["Dm2",    '#CCCC00', 25],
     ["Dm3",    '#CCCC66'    ],
     ["Dm8",    '#999900', 23],
     ["Dm9",    '#666600'    ],
     ["Pm1",    '#66FF99'    ],
     ["Pm2",    '#33CC66'    ],
     ["TmY10",  '#FF0000'    ],
     ["TmY11",  '#CC0000'    ],
     ["TmY13",  '#FF3333'    ],
     ["TmY14",  '#CC3333'    ],
     ["TmY3",   '#990000'    ],
     ["TmY5",   '#FF6666', 15],
     ["TmY9",   '#CC6666'    ],
     ["Y3",     '#99CC33'    ],
     ["Lawf1",  '#9933FF'    ] ]

OLD_TABLE = [   
        [  0,119,  0,116,100, 52,  0,   0,  0, 61,  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,], 
        [  8,  6,199, 36,  8,  6, 17,   0,  0,  2,  0,  0,  0,  7,  0,  0, 10,   0,  0,  5,  2,  0,  0,  1,  0,  5,  1,], 
        [  0,  0, 12,  0,  0,  0,  0,   0,  0,  4,  0,  0,  0,  1,  0,  0,  0,   0,  0,  0, 16,  0,  0,  0,  0,  0,  0,], 
        [  7,  1, 86,  7,  0,  2,  0,   0,  0,  0,  0,  0,  0,  5,  0,  6,  1,   0,  0,  0,  0,  0,  0,  0,  0,  0,  1,], 
        [ 20, 37,  0, 39,  3, 12,  0,   4,  0, 12,  0,  0,  0, 14,  0,  0,  5,   0,  0, 33,  0,  0,  0,  0,  0, 11,  2,], 
        [ 44, 22,  0,  0, 36,  0,  0,  26,  8,  0,  0,  1,  0,  0,  8,  0,  0,   0, 15,  0,  0,  0,  0,  0,  0,  0,  7,], 
        [  0,  2,  0,  2,  0,  0,  0,   0,  0,  2,  0,  0,  0,  0,  0,  7,  0,   1,  0,  0,  0,  0,  1,  0,  0,  0,  0,], 
        [  0,  0,  0,  0, 35,  0,  0,   0,153,  0,106, 56, 67,  0,  0,  0,  0,   0,  0,  0,  0,  0, 10,  0,  0,  0,  0,], 
        [  0,  1,  0,  0, 12,  0,  5,   0,  0,  0,  1,  0,  3,  1,  0,  0,  6,   0,  0,  0,  4,  0,  2,  0,  1,  0,  0,], 
        [  0,  0,  5,  0,  9,  0,  0,  37, 18,  0,  0, 62, 20,  3,  0,  0,  0,   0,  0,  0,  7,  0, 10,  0,  3,  0,  0,], 
        [  0,  0,  0,  0, 12,  0,  1,   0,  0,  4,  0,  0,  3, 10,  1,  1,  2,   0,  0,  1,  6,  0,  0,  0,  1,  0,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,], 
        [  0,  1,  0,  1,  0,  2,  2,   0,  1,  2,  1,  0,  0,  0,  0, 13,  0,   0,  0,  2,  0,  0,  0,  0,  0,  0,  0,], 
        [  0,  5,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  1,  1,  0,  4,  2,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   0,  0,  0, 15,  0,  5,  0,  1,  0,  0,   0,  0,  0,  2,  0,  0,  0,  0,  0,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  2,  0,  0,  0,  1,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,], 
        [  0,  0,  0,  2,  0,  0,  0,   0,  1,  0,  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,], 
        [  6, 20,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,   0,  0, 25,  1, 11, 11,  0,  0,  9, 11,], 
        [  0, 14,  0,  0,  0,  0,  0,   0,  0,  9,  0,  0,  0,  0,  0,  0,  0,   0,  0,  0, 30,  0, 20,  0, 17,  0,  0,], 
        [  0,  0,  4,  1,  1,  0,  0,   0,  0,  0,  0,  0,  0,  1,  0,  2,  0,   0,  0,  0, 18,  0,  7,  0,  7,  0,  0,], 
        [  0,  0,  6,  0,  0,  0,  0,   0,  5,  0,  1,  0,  2,  3,  0,  1,  4,   0,  0,  5,  0,  0,  0,  0,  0,  0,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   3,  0,  0,  0,  0,  0,  0,  0,  0,  0,   5,  3,  0,  1,  0,  0, 35,  0,  1,  0,], 
        [  0,  0,  0,  0,  0,  0,  1,   0,  0,  0,  0,  1,  0,  0,  0,  0,  0,   0,  0,  0,  5,  0,  1,  0,  3,  0,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  1,  0,  0,  0,  0,   0,  0,  1,  0,  0,  0,  0,  0,  3,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  1,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,   0,  0, 11,  0,  0,  0,  0,  0,  2,  0,], 
        [  0,  0,  0,  0,  0,  0,  0,   0,  0,  0,  0,  0,  3,  0,  0,  1,  0,   0,  1,  6,  0,  0,  0,  0,  0,  1,  2,], 
]

#Classes
class CellType:
    def __init__(self, name, color, single_column_paper_idx=None, neurotransmitters=[]):
        self.name = name
        self.color = color
        self.single_column_paper_idx = single_column_paper_idx
        self.neurotransmitters = neurotransmitters
        self.columnar = self.is_columnar()
    
    def is_columnar(self):
        regex = re.compile("^Tm?[34]$")
        m = regex.match(self.name)
        if (self.single_column_paper_idx and not m):
            return True
        else:
            return False

class Body:
    def __init__(self, id, name, cell_type=None):
        self.id = id
        self.name = name
        self.cell_type = cell_type
        self.column = self.detect_column()
        self.connections = []
        self.location = []
        
    def detect_column(self):
        if (self.cell_type and self.cell_type.is_columnar()):
            m = re.match(".*([A-F])$", self.name)
            if m:
                return columns[m.groups()[0]]
            m = re.match(".*home$", self.name)
            if m:
                return columns['H']
            else:
                return columns['']
        else:
            return columns['']
    
    def calc_inputs_and_outputs(self):
        input_ar = []
        output_ar = []
        self.inputs_count = 0
        self.outputs_count = 0
        for c in self.connections:
            if c.tbar_id == self.id:
                output_ar.append(c.synapse_id)
                self.outputs_count += 1
            else:
                input_ar.append(c.tbar_id)
                self.inputs_count += 1
        self.inputs = {}
        for i in input_ar:
            if i not in self.inputs:
                self.inputs[i] = 0
            self.inputs[i] += 1
        self.outputs = {}
        for i in output_ar:
            if i not in self.outputs:
                self.outputs[i] = 0
            self.outputs[i] += 1
    
    def top_inputs(self, count=12):
        sorted_inputs = sorted(self.inputs.iteritems(), key=operator.itemgetter(1), reverse=True)
        return sorted_inputs[0:count]
    
    def top_outputs(self, count=12):
        sorted_outputs = sorted(self.outputs.iteritems(), key=operator.itemgetter(1), reverse=True)
        return sorted_outputs[0:count]
        
    def calc_location(self):
        pass
    
class Connection:
    def __init__(self, tbar_body_id, synapse_body_id, location):
        self.tbar_id = tbar_body_id
        self.synapse_id = synapse_body_id
        self.location = location   
    
class Column:
    def __init__(self, name):
        self.name = name
        self.number = self.calc_number()
        self.pale_or_yellow = self.pale_or_yellow()
        
    def calc_number(self):
        col_idx = {
            'A': 2,
            'B': 3,
            'C': 4,
            'D': 5,
            'E': 6,
            'F': 7,
            'H': 1,
        }
        if self.name in col_idx:
            return col_idx[self.name]
        else:
         return 0
    
    def pale_or_yellow(self):
        if self.number:
            if self.name in YELLOW_COLUMNS:
                return "yellow"
            else: 
                return "pale"
        return False

#functions   
def calculate_cell_type(type_list, name):
    type_list.sort(key=len, reverse=True)
    for t in type_list:
        if t == name[:len(t)]:
            return t
    return

def volume_and_area(id):
    return_data = {'volume': None,
                   'surface_area':0
                   }
    #TODO delete next line
    return return_data
    u = "http://emdata2:9000/api/node/fa9/graph/neighbors/%d" % id
    handler = url.urlopen(u)
    data = handler.read()
    jdata = json.loads(data)    
    volume = None
    surface_area = 0
    for i in jdata['Vertices']:
        if i['Id'] == id:
            return_data['volume'] = i['Weight']
            break
    for i in jdata['Edges']:
        return_data['surface_area'] += i['Weight']
    return_data['volume'] /= 1e6
    return_data['surface_area'] /= 1e4
    return return_data

def neurotransmitters(fi):
    f = open(fi)
    data = f.readlines()
    f.close()
    #remove header
    data.pop(0)   
    nlist = [y.split("\t") for y in data]
    return { n[0]: { 'transmitter': n[1], 'receptor': n[2] } for n in nlist }

def populate_bodies(body_json, synapse_json, CellTypeBodies):
    Bodies = {}
    for body_id in body_json.keys():
        body = body_json[body_id]
        name = body_id
        cell_type = None
        if 'Name' in body:
            name = body['Name']
            cell_type = calculate_cell_type(cell_type_list, name)
        if cell_type:
            Bodies[body_id] = Body(body_id, name, CellTypes[cell_type])
            CellTypeBodies[cell_type].append(body_id)
        else:
            Bodies[body_id] = Body(body_id, name)
    for i in synapse_json['data']:
        tbar_body_id = str(i['T-bar']['body ID'])
        if 'partners' in i:
            for j in i['partners']:
                synapse_body_id = str(j['body ID'])
                c = Connection(tbar_body_id, synapse_body_id, j['location'])
                if synapse_body_id in Bodies:
                    Bodies[synapse_body_id].connections.append(c)
                if tbar_body_id in Bodies:
                    Bodies[tbar_body_id].connections.append(c)
    for body_id in Bodies:
        Bodies[body_id].calc_inputs_and_outputs()
    return Bodies

def calculate_cpi(cell, instances):
    count = float(len(cell))
    per_inst = count / float(instances)
    mean = np.mean(cell)
    stdev = np.std(cell)
    total = sum(cell)
    cpi = per_inst * mean
    cpistat = {
        'count': count,
        'per_instance': per_inst,
        'mean': mean,
        'stdev': stdev,
        'cpi': cpi,
        'sum': total,
    }
    return cpistat

def calculate_cpi_stats(data, instances):
    cpi_by_cell = {}
    for kind in ['named', '7col', 'pale', 'yellow']:
        for ctype in data[kind]:
            if ctype not in cpi_by_cell:
                cpi_by_cell[ctype] = {
                                        'named': {},
                                        '7col': {},
                                        'yellow': {},
                                        'pale': {},
                }
            cpi_by_cell[ctype][kind] = calculate_cpi(data[kind][ctype], instances)
    return cpi_by_cell
        
def write_outfile(output, outdir, export):
    outfile = "%s/em_table_%s.json" % (outdir, export)
    return fc.writeJSONFile(outfile, o)

def generate_output_for_export(body_json, synapse_json):
    CellTypeBodies = { c:[] for c in cell_type_list }
    Bodies = populate_bodies(body_json, synapse_json, CellTypeBodies)
    o = {}    
    for cell_type in CellTypeBodies:
        o[cell_type] = {
            'cells':{},
            'stats':{'color': CellTypes[cell_type].color, 'neurotransmitter': {}},
            'inputs':{
                'total': 0,
                'named': {},
                '7col': {},
                'pale': {},
                'yellow': {},
                'cross_column' : [
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0]
                    ],
                'cpi_stats': {},
            },
            'outputs':{
                'total': 0,
                'named': {},
                '7col': {},
                'pale': {},
                'yellow': {},
                'cross_column' : [
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0]
                    ],
                'cpi_stats': {},
            }}

        if cell_type in neurotransmitter_dict:
            o[cell_type]['stats']['neurotransmitter'] = neurotransmitter_dict[cell_type]

        for body in CellTypeBodies[cell_type]:
            try:
                sv = volume_and_area(Bodies[body].id)
            except:
                sv = {'volume': 0, 'surface_area': 0}
            o[cell_type]['cells'][Bodies[body].id] = {
                                                      'name': Bodies[body].name,
                                                      'inputs': [],
                                                      'outputs': [],
                                                      'inputs_by_type' : {},
                                                      'outputs_by_type' : {},
                                                      'surface_area': sv['surface_area'],
                                                      'volume': sv['volume'],
                                                      'inputs_count': Bodies[body].inputs_count,
                                                      'outputs_count': Bodies[body].outputs_count,
            }
            for i_o in ['inputs', 'outputs']:
                #aggragate
                body_io = getattr(Bodies[body], i_o)
                for io_num in body_io:
                    o[cell_type][i_o]['total'] += body_io[io_num]
                    if io_num in Bodies:
                        if Bodies[io_num].cell_type:
                            cell_type_name = Bodies[io_num].cell_type.name
                        else:
                            cell_type_name = 'Unknown'
                        c1 = Bodies[body].column.number
                        c2 = Bodies[io_num].column.number
                        o[cell_type][i_o]['cross_column'][c1][c2] += body_io[io_num]
                        if cell_type_name not in o[cell_type][i_o]['named']:
                            o[cell_type][i_o]['named'][cell_type_name] = []
                        o[cell_type][i_o]['named'][cell_type_name].append(body_io[io_num])
                        if cell_type_name not in o[cell_type]['cells'][Bodies[body].id][i_o + "_by_type"]:
                            o[cell_type]['cells'][Bodies[body].id][i_o + "_by_type"][cell_type_name] = []
                        o[cell_type]['cells'][Bodies[body].id][i_o + "_by_type"][cell_type_name].append(body_io[io_num])
                        if Bodies[io_num].cell_type and Bodies[io_num].cell_type.columnar:
                            if cell_type_name not in o[cell_type][i_o]['7col']:
                                o[cell_type][i_o]['7col'][cell_type_name] = []
                            o[cell_type][i_o]['7col'][cell_type_name].append(body_io[io_num])
                            if Bodies[io_num].column.pale_or_yellow == 'pale':
                                if cell_type_name not in o[cell_type][i_o]['pale']:
                                    o[cell_type][i_o]['pale'][cell_type_name] = []
                                o[cell_type][i_o]['pale'][cell_type_name].append(body_io[io_num])
                            else:
                                if cell_type_name not in o[cell_type][i_o]['yellow']:
                                    o[cell_type][i_o]['yellow'][cell_type_name] = []
                                o[cell_type][i_o]['yellow'][cell_type_name].append(body_io[io_num])
                #by cell
                top_func = getattr(Bodies[body], 'top_%s' % (i_o))
                for b in top_func():
                    b_name = b[0]
                    reciprocals = 0
                    my_cell_type = False
                    if b[0] in Bodies:
                        b_name = Bodies[b[0]].name
                        io_attr = getattr(Bodies[b[0]], i_o)
                        if Bodies[body].id in io_attr:
                            reciprocals = io_attr[Bodies[body].id]
                        if Bodies[b[0]].cell_type:  
                            my_cell_type = Bodies[b[0]].cell_type.name
                    put_dict = {
                                  'id': b[0],
                                  'name': b_name,
                                  'cell_type': my_cell_type,
                                  i_o: b[1],
                                  'reciprocals': reciprocals
                                  }
                    o[cell_type]['cells'][Bodies[body].id][i_o].append(put_dict)
        for i_o in ['inputs', 'outputs']:
            #print cell_type, i_o
            o[cell_type][i_o]['cpi_stats'] = calculate_cpi_stats(o[cell_type][i_o], len(CellTypeBodies[cell_type]))

    return o
    

#main
if __name__ == '__main__': 
    parser = argparse.ArgumentParser(description="Parse raveler exports for flyem tables")

    args = parser.parse_args()

    #create columns
    columns = {}   
    for i in ['A','B','C','D','E','F','H','']:
        columns[i] = Column(i)
    
    #create cell types
    CellTypes = {}
    for i in CATEGORIES:
        if len(i) == 2:
            CellTypes[i[0]] = CellType(i[0], i[1])
        else:
            CellTypes[i[0]] = CellType(i[0], i[1], i[2])                
    cell_type_list = [CellTypes[c].name for c in CellTypes]

    #neurotransmitters for each cell type
    neurotransmitter_dict = neurotransmitters('nlist.txt')
    server = "emrecon100.janelia.priv"
    uuid = '2a3'
    # Open a connection to DVID
    connection = httplib.HTTPConnection(server, timeout=5.0)
    (body_json, synapse_json) = fc.load_json_from_hackathon()
    output = generate_output_for_export(body_json, synapse_json)
    #print output
    fc.writeJSONFile('em_table_hackathon.json', output)
    #fc.save_to_dvid(connection, uuid, 'fly_em_tables', "em_table_" + dataname,  output)      
    
    
    
