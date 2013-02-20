#!/usr/bin/env python
#
# Basic client to browse and search NASA JPL Horizons data
#

import sys
import csv
import re
import json
import telnetlib
import scoring
import estimate
from pymongo import Connection

DATA_PATH = 'data/fulldb-20130220.csv'
DV_PATH = 'data/deltav/db.csv'
MASS_PATH = 'data/masses.txt'
G = 6.67300e-20   # km^3 / kgs^2

THOLEN_MAPPINGS = {
  'M': 'M',
  'E': 'M',
  'P': 'P',
  'B': 'B',
  'C': 'C',
  'F': 'C',
  'G': 'Cgh',
  'Q': 'Q',
  'R': 'R',
  'V': 'V',
  'T': 'T',
  'D': 'D',
  'A': 'A',
}

def populateDb():
  conn = Connection('localhost', 27017)
  db = conn.asterank
  coll = db.asteroids
  coll.drop()
  coll.ensure_index('full_name', unique=True, background=True)
  coll.ensure_index('score', background=True)
  coll.ensure_index('profit', background=True)
  #coll.ensure_index('prov_des', background=True)
  coll.ensure_index('closeness', background=True)
  coll.ensure_index('price', background=True)

  # load mass data
  print 'Loading mass data...'
  f = open(MASS_PATH, 'r')
  lines = f.readlines()
  f.close()

  massd = {}
  for line in lines:
    parts = line.split(' ')
    massidx = len(parts) - 2
    mass = float(parts[massidx])
    name = ' '.join(parts[:massidx]).strip()

    if name not in massd:
      massd[name] = []
    massd[name].append(mass)

  for name, masses in massd.iteritems():
    avg = sum(masses) / len(masses)
    massd[name] = avg
  del massd['']


  # load delta v data
  f = open(DV_PATH, 'r')
  lines = f.readlines()
  f.close()

  print 'Loading delta-v data...'
  deltav_map = {}
  for line in lines:
    parts = line.split(',')
    des = parts[0]
    dv = float(parts[1])
    deltav_map[des] = dv

  print 'Loading small body data...this may take a while'
  print DATA_PATH
  reader = csv.DictReader(open(DATA_PATH), delimiter=',', quotechar='"')
  designation_regex = re.compile('.*\(([^\)]*)\)')
  n = 0
  for row in reader:
    if row['spec_B'] == '':
      newspec = THOLEN_MAPPINGS.get(row['spec_T'], None)
      if newspec:
        # TODO should have our own merged spec row, instead we overwrite spec_B
        row['spec_B'] = newspec.replace('type', '').strip()
      elif row['pdes'] == '2012 DA14':
        row['spec_B'] = 'L'
      else:
        #continue # TODO temp
        row['spec_B'] = 'S'

    # match it with its delta-v
    m = designation_regex.match(row['full_name'])
    if 'pdes' in row and 'prov_des' not in row:
      row['prov_des'] = row['pdes']  # backwards compatibility for NASA change
    if m:
      row['prov_des'] = m.groups()[0]
      dv = deltav_map.get(row['prov_des'], None)
      if dv:
        row['dv'] = dv
    else:
      row['prov_des'] = ''

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

    # match mass
    if row['full_name'] in massd:
      row['GM'] = massd[row['full_name']] * G

    # compute score
    row['price'], row['saved'] = scoring.price(row)
    # assume the cost of mining a distant asteroid per kg won't be much better
    # than cost to launch from earth
    # ie., 99.999% of revenue is spent on operations
    row['saved'] = row['saved'] * 0.00001
    row['closeness'] = scoring.closeness_weight(row)
    row['profit'] = scoring.profit(row)

    # TODO move this into scoring once I get it right
    score = min(row['price'], 1e14) / 5e12
    if score < 0.0001:
      # It's worthless, so closeness doesn't matter
      row['score'] = score
    else:
      score = score * row['closeness']**3
    row['score'] = score

    coll.update({'full_name': row['full_name']}, {'$set': row}, True)  # upsert
    n += 1
    if n % 3000 == 0:
      print n, '...'

  print 'Loaded', n, 'asteroids'

def compositions():
  print json.dumps(estimate.SPECTRA_INDEX)
  return estimate.SPECTRA_INDEX

def materials():
  print json.dumps(estimate.MATERIALS_INDEX)
  return estimate.MATERIALS_INDEX

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
