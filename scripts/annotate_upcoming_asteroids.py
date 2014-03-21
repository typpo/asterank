#!/usr/bin/env python
#
# Annotates upcoming asteroids json file with their diameters.
# Used in 2D upcoming asteroids view.
#

import sys
import yaml
import json
import requests

MAX_RESULTS = 600

if len(sys.argv) != 3:
  print 'usage: annotate upcoming_asteroids.json output.json'
  sys.exit(1)

roids = yaml.load(open(sys.argv[1]))
cache = {}
c = 0
for roid in roids:
  if c > MAX_RESULTS:
    break
  c += 1
  print 'Annotating %s' % roid['name']
  if roid['name'] in cache:
    resp = cache[roid['name']]
  else:
    try:
      resp = json.loads(requests.get('http://localhost:5000/api/autocomplete?query=%s' % roid['name']).text)
    except:
      print '******** QUERY FAILED'
      continue
    cache[roid['name']] = resp
  for possibility in resp:
    if possibility['name'] == roid['name'] or possibility['prov_des'] == roid['name']:
      print 'Matched'
      diameter = possibility['est_diameter'] if 'est_diameter' in possibility else possibility['diameter']
      if diameter:
        roid['diameter'] = diameter
        print 'Diameter is %f' % diameter
      else:
        print 'No diameter'
      break

f = open(sys.argv[2], 'w')
f.write(json.dumps(roids, indent=2))
f.close()
