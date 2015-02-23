#!/usr/bin/python
import json
import pprint
import sys
import argparse
import functions_common as fc
import httplib

DEFAULT_LOCATION = [0,0,0]

def ave_location(l):
    num_locations = float(len(l))
    if num_locations == 0:
        return DEFAULT_LOCATION
    sum = [0,0,0]
    for i in l:
        sum[0] += i[0] + 0.177 * i[2] #offset
        sum[1] += i[1] - 0.153 * i[2] #offset
        sum[2] += i[2]
    return [int(x/num_locations) for x in sum]

def bodyNames(data):
    name = [data[i]['Name'] for i in data.keys() if 'Name' in data[i]]
    return list(set(name))

def parseSynapse(synapse_json, data, inputs=True):
    # body = { i: {'location': [], 'connections': {}, 'name':
    #     (data[i]['Name'] if 'Name' in data[i] else i)} for i in data.keys()}
    body = {}
    # print body.keys()
    for i in synapse_json['data']:
        body_id = i['T-bar']['body ID']
        if 'partners' in i:
            if body_id not in body:
                body[body_id] = {
                    'location': [], 
                    'connections': {}, 
                    'name': str(body_id),
                }
                if str(body_id) in data:
                    body[body_id]['name'] = data[str(body_id)]['Name']
            body[body_id]['location'].append(i['T-bar']['location'])
            for j in i['partners']:
                partner_id = j['body ID']
                if partner_id not in body:
                    body[partner_id] = {
                    'location': [], 
                    'connections': {}, 
                    'name': str(partner_id),
                }
                if str(partner_id) in data:
                    body[partner_id]['name'] = data[str(partner_id)]['Name']
                if inputs:
                    if partner_id != 0 and partner_id in body:
                        if body_id not in body[partner_id]['connections']:
                            body[partner_id]['connections'][body_id] = {'count': 0, 'locations': []}
                            body[partner_id]['location'].append(j['location'])
                        body[partner_id]['connections'][body_id]['count'] += 1
                        body[partner_id]['connections'][body_id]['locations'].append(j['location'])
                else:
                    if partner_id not in body[body_id]['connections']:
                        body[body_id]['connections'][partner_id] = {'count': 0, 'locations': []}
                    if partner_id in body:
                        body[partner_id]['location'].append(j['location'])
                        body[body_id]['connections'][partner_id]['count'] += 1
                        body[body_id]['connections'][partner_id]['locations'].append('locations')
    return body

def genSigmaFile(body, min_edges=3):
    sigmaj = {'nodes': [], 'edges': []}
    edge_id = 1
    nodes = set()
    for i in body:
        for j in body[i]['connections']:
            if body[i]['connections'][j]['count'] >= min_edges and j in body:
                nodes.add(i)
                nodes.add(j)
                sigmaj['edges'].append({
                    'source': str(i),
                    'target': str(j),
                    'id': str(edge_id),
                    'size': str(body[i]['connections'][j]['count']),
                    #'locations': body[i]['connections'][j]['locations']
                })
                edge_id += 1
    for i in nodes:
        name = body[i]['name']
        if body[i]['location']:
            location = ave_location(body[i]['location'])
        else:
            location = DEFAULT_LOCATION
        b = [k for k in body[i]['connections'] if body[i]['connections'][k]['count'] >= min_edges]
        size = len(b)
        sigmaj['nodes'].append({'label': str(name),
                                'id':str(i),
                                'size': size,
                                'x': location[0],
                                'y': location[1],
                                'location': [location[0], location[1], location[2]]
                                })
    return sigmaj

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Parse raveler exports for gorgonian")
    parser.add_argument('--output', dest='output', default='.', help='directory to store outputs')
    parser.add_argument('--hackathon', action='store_true', dest='hackathon', default=False, help='get data in hackathon format')
    args = parser.parse_args()


    (body_json, synapse_json) = fc.load_json_from_hackathon()
    name = bodyNames(body_json)
    name_json = { i:  (body_json[i]['Name'] if 'Name' in body_json[i] else i) for i in body_json.keys()}
    body = parseSynapse(synapse_json, body_json)
    sigmaj = genSigmaFile(body)
    
    fc.mkdir_p(args.output)

    server = "emrecon100.janelia.priv"
    uuid = '2a3'
    # Open a connection to DVID
    connection = httplib.HTTPConnection(server, timeout=5.0)
    fc.save_to_dvid(connection, uuid, 'gorgonian', 'names_autocomplete.txt', name)
    fc.save_to_dvid(connection, uuid, 'gorgonian', 'em_name_dict.json', name_json)
    fc.save_to_dvid(connection, uuid, 'gorgonian', 'all_em_inputs.json', sigmaj)
    # else:
    #     fc.writeJSONFile("%s/names_autocomplete.txt" % (args.output), name)
    #     fc.writeJSONFile("%s/em_name_dict.json" % (args.output), name_json)
    #     fc.writeJSONFile("%s/all_em_inputs.json" % (args.output), sigmaj)

