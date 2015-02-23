import json
import os
import errno
import httplib
import json
from pydvid import keyvalue as kv
from pydvid import general

def readJSONFile(filename):
    f = open(filename)
    my_json = json.load(f)
    f.close()
    return my_json

def writeJSONFile(filename, json_data):
    f = open(filename, "w")
    f.write(json.dumps(json_data))
    f.close()

def mkdir_p(path):
    try:
        os.makedirs(path)
    except OSError as exc: # Python >2.5
        if exc.errno == errno.EEXIST and os.path.isdir(path):
            pass
        else: raise

def mask_cell_name(cell_name):
    #NO LONGER NECESSARY
    # name_dict = {
    #     'Lawf2' : 'Identified_Cell_1',
    #     'Mi16' : 'Identified_Cell_2',
    #     'Dm11' : 'Identified_Cell_3',
    #     'Dm12' : 'Identified_Cell_4',
    #     'Dm13' : 'Identified_Cell_5',
    #     'Dm14' : 'Identified_Cell_6',
    #     'Dm15' : 'Identified_Cell_7',
    #     'Dm16' : 'Identified_Cell_8',
    #     'Dm17' : 'Identified_Cell_9',
    #     'Pm3' : 'Identified_Cell_10',
    #     'Pm4' : 'Identified_Cell_11',
    #     'ukTmY-1' : 'Identified_Cell_12',
    #     'Mt5' : 'Identified_Cell_13',
    #     'Mt8' : 'Identified_Cell_14',
    # }
    # names_list = name_dict.keys()
    # names_list.sort()
    # for name in names_list:
    #     if name in cell_name:
    #         return cell_name.replace(name, name_dict[name])
    return cell_name

def load_json_from_export(export):
    try:   
        body_json = readJSONFile("%s/annotations-body.json" % (export))
        synapse_json = readJSONFile("%s/annotations-synapse.json" % (export))
        return (body_json, synapse_json)
    except:
        print "Bad dir %s" % (export)
        raise

def load_json_from_dvid(connection, uuid, dataname):
    try:
        body_json = json.loads(kv.get_value(connection, uuid, dataname, 'annotations-body.json'))
        synapse_json = json.loads(kv.get_value(connection, uuid, dataname, 'annotations-synapse.json'))
        return (body_json, synapse_json)
    except:
        print "Could not retrieve data from DVID"
        raise

def load_json_from_hackathon():
    try:   
        body_json = readJSONFile("neuronsinfo.json")
        synapse_json = readJSONFile("synapses.json")
        return (body_json, synapse_json)
    except:
        print "Bad files"
        raise

def save_to_dvid(connection, uuid, dataname, key, value):
    #create dataname if it does not exist
    if not is_dataset_in_dvid(connection, uuid, dataname):
        kv.create_new(connection, uuid, dataname)
    return kv.put_value(connection, uuid, dataname, key, json.dumps(value))

def is_dataset_in_dvid(connection, uuid, dataset):
    dataset_details = general.get_repos_info( connection )
    for dataset_uuid in dataset_details.keys():
        if dataset_uuid.startswith(uuid):
            return dataset in dataset_details[dataset_uuid]['DataInstances'].keys()
    return False
