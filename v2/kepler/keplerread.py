#!/usr/bin/env python

import urllib
import json
import sys

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

print planets[0]
print planets[100]
