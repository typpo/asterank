#!/usr/bin/env python

import json
import sys
from pymongo import MongoClient

if len(sys.argv) < 2:
  print 'usage: python read.py filepath'
  sys.exit(1)

f = open(sys.argv[1], 'r')
results = json.loads(f.read())
f.close()

numrows = results['numberOfRows']
planets = [{} for i in range(numrows)]

for col, values in results['columns'].iteritems():
  for i in range(numrows):
    planets[i][col] = values[i]

# put in db
conn = MongoClient()
db = conn.asterank
coll = db.kepler
coll.drop()
coll.ensure_index('KOI', unique=True)

for planet in planets:
  coll.insert(planet, continue_on_error=True)

print 'Added', len(planets), 'planets'
print 'Done.'
