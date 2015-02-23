import re
import functions_common as fc

core = open('Core.txt')
data = {}

for l in core:
	l = l.rstrip()
	m = re.match('From (\w+) to (\w+)', l)
	if m:
		match = m.groups(1)
		from_cell =  match[0]
		to_cell = match[1]
		if from_cell not in data:
			data[from_cell] = {}
		if to_cell not in data[from_cell]:
			data[from_cell][to_cell] = {
				'count' : [],
				'overlap' : [],
			}
	else:

		m2 = re.match(' +(\d+) +(\d+) +(\d+) +(\d+) +(\d+) +(\d+) +(\d+)', l)
		if m2:
			try:
				data[from_cell][to_cell]['count'].append(list(m2.groups(0)))
			except:
				pass
		m3 = re.match('.* +(\d+.\d*) +(\d+.\d*) +(\d+.\d*) +(\d+.\d*) +(\d+.\d*) +(\d+.\d*) +(\d+.\d*)', l)
		if m3:
			try:
				data[from_cell][to_cell]['overlap'].append(list(m3.groups(0)))
			except:
				pass
fc.writeJSONFile('core.json', data)