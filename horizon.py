#!/usr/bin/env python
#
# Basic client to browse and search NASA JPL Horizons data
#

import sys
import csv
import telnetlib
import scoring
from pymongo import Connection

DATA_PATH = 'data/fulldb.csv'

def populateDb():
  print 'Loading small body data...this may take a little bit'

  conn = Connection('localhost', 27017)
  db = conn.asterank
  coll = db.asteroids
  coll.ensure_index('full_name', unique=True)

  reader = csv.DictReader(open(DATA_PATH), delimiter=',', quotechar='"')
  n = 0
  for row in reader:
    for key,val in row.items():
      # Clean up the input
      try:
        fv = float(val)
      except ValueError, TypeError:
        row[key] = val.strip()
      else:
        row[key] = fv

    # compute score
    row.score = scoring.score(row)

    coll.update({'full_name': row['full_name']}, {'$set': row}, True)  # upsert
    n += 1
    if n % 10000 == 0:
      print n, '...'

  print 'Loaded', n, 'asteroids'


def telnetLookup():
  t = telnetlib.Telnet()
  t.open('horizons.jpl.nasa.gov', 6775)
  print t.read_very_eager()

def test():
  print "I'm here"

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print 'usage: horizons <fn name>'
    sys.exit(1)
  locals()[sys.argv[1]]()
