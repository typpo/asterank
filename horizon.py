#!/usr/bin/env python

import csv
import telnetlib
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

    coll.update({'full_name': row['full_name']}, {'$set': row}, True)  # upsert
    n += 1
    if n % 10000 == 0:
      print n, '...'

  print 'Loaded', n, 'asteroids'


def telnetLookup():
  t = telnetlib.Telnet()
  t.open('horizons.jpl.nasa.gov', 6775)
  t.read_very_eager()

if __name__ == "__main__":
  populateDb()
