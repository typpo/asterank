#!/usr/bin/env python

import json
import sys
import csv
from pymongo import MongoClient

if len(sys.argv) < 2:
  print 'usage: python read.py filepath'
  sys.exit(1)

reader = csv.DictReader(open(sys.argv[1]), delimiter=',', quotechar='"')
conn = MongoClient()
db = conn.asterank
coll = db.exo
coll.drop()
coll.ensure_index('pl_fulldes', unique=True)

c = 0
for row in reader:
  row['pl_fulldes'] = '%s%s' % (row['pl_hostname'], row['pl_letter'])
  coll.insert(row, continue_on_error=True)
  c += 1


# put in db

print 'Added', c, 'confirmed exoplanets'
print 'Done.'
