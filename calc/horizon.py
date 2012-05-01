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
  print 'Loading small body data...this may take a while'

  conn = Connection('localhost', 27017)
  db = conn.asterank
  coll = db.asteroids
  coll.ensure_index('full_name', unique=True)
  coll.ensure_index('score')

  reader = csv.DictReader(open(DATA_PATH), delimiter=',', quotechar='"')
  n = 0
  for row in reader:
    #if row['spec_T'] == '' and row['spec_B'] == '':
    if row['spec_B'] == '':
      #continue
      row['spec_B'] = 'S'

    # Clean up inputs
    for key,val in row.items():
      try:
        fv = float(val)
      except ValueError, TypeError:
        row[key] = val.strip()
      else:
        row[key] = fv
    row['spec_T'] = row['spec_T'].replace(':', '')
    row['spec_B'] = row['spec_B'].replace(':', '')

    # compute score
    row['price'], row['saved'] = scoring.price(row)
    row['closeness'] = scoring.closeness_weight(row)
    row['score'] = row['price'] / 1e9 * row['closeness']

    coll.update({'full_name': row['full_name']}, {'$set': row}, True)  # upsert
    n += 1
    if n % 1000 == 0:
      print n, '...',

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
  l = locals()
  fnname = sys.argv[1]
  if fnname in l:
    l[fnname]()
  else:
    print 'No such operation "%s"' % fnname
