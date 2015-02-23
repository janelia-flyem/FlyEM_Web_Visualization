#!/usr/bin/python
import json
import pprint
import sys
import argparse
import functions_common as fc
import httplib

def bodyNames(data):
    names = [data[i]['Name'] for i in data.keys() if 'Name' in data[i]]
    types = [data[i]['Type'] for i in data.keys() if 'Type' in data[i]]
    names.extend(types)
    return list(set(names))

def namesDict(data):
	names = {data[i]['Name']: [i] for i in data.keys() if 'Name' in data[i]}
	for body_id in data.keys():
		if 'Type' in data[body_id]:
			if data[body_id]['Type'] not in names:
				names[data[body_id]['Type']] = []
			if body_id not in names[data[body_id]['Type']]:
				names[data[body_id]['Type']].append(body_id)
	return names

def parseSynapse(synapse_json, data, inputs=True):
    body = {}
    # print body.keys()
    for i in synapse_json['data']:
        body_id = i['T-bar']['body ID']
        if 'partners' in i:
            if body_id not in body:
                body[body_id] = {
                    'inputs': {}, 
                    'outputs': {},
                    'name': str(body_id),
                }
                if str(body_id) in data:
                    body[body_id]['name'] = data[str(body_id)]['Name']
            for j in i['partners']:
                partner_id = j['body ID']
                if partner_id not in body:
                	body[partner_id] = {
                    'inputs': {}, 
                    'outputs': {},
                    'name': str(partner_id),
                }
                if str(partner_id) in data:
                    body[partner_id]['name'] = data[str(partner_id)]['Name']
                #inputs
                if partner_id != 0 and partner_id in body:
                    if body_id not in body[partner_id]['inputs']:
                        body[partner_id]['inputs'][body_id] = 0
                    body[partner_id]['inputs'][body_id] += 1
                #outputs
                if partner_id not in body[body_id]['outputs']:
                    body[body_id]['outputs'][partner_id] = 0
                body[body_id]['outputs'][partner_id] += 1
    return body

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Parse raveler exports for gorgonian")
    parser.add_argument('--output', dest='output', default='.', help='directory to store outputs')
    parser.add_argument('--hackathon', action='store_true', dest='hackathon', default=False, help='get data in hackathon format')
    args = parser.parse_args()


    (body_json, synapse_json) = fc.load_json_from_hackathon()
    names_for_autocomplete = bodyNames(body_json)
    names_to_body_id = namesDict(body_json)
    body = parseSynapse(synapse_json, body_json)

    server = "emrecon100.janelia.priv"
    uuid = '2a3'
    # Open a connection to DVID
    connection = httplib.HTTPConnection(server, timeout=10.0)

    fc.writeJSONFile('names_to_body_id.json', names_to_body_id)
    fc.writeJSONFile('inputs_outputs.json', body)
    fc.writeJSONFile('names.json', names_for_autocomplete)
    #fc.save_to_dvid(connection, uuid, 'codingcircle', 'names_to_body_id.json', names_to_body_id)
    #fc.save_to_dvid(connection, uuid, 'codingcircle', 'inputs_output.json', body)
    #fc.save_to_dvid(connection, uuid, 'codingcircle', 'names.json', names_for_autocomplete)