#!/usr/bin/env python
#
# Loads NASA JPL Horizons data into db
#

import sys
import argparse
import csv
import re
import json
import telnetlib
import scoring
import estimate
from pymongo import Connection

G = 6.67300e-20   # km^3 / kgs^2
DATA_PATH = DV_PATH = MASS_PATH = ''

# Approximate mapping from Tholen to SMASS
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

COMET_CLASSES = set(['COM', 'CTc', 'ETc', 'HTC', 'HYP', 'JFc', 'JFC', 'PAR'])

def populateDb():
  _run(partial=False)

def populatePartialDb():
  _run(partial=True)

def _run(partial=False):
  # Constants and settings

  # Fill database
  conn = Connection('localhost', 27017)
  db = conn.asterank
  coll = db.asteroids
  print 'Dropping asteroids (SBDB) collection...'
  coll.drop()
  coll.ensure_index('full_name', unique=True, background=True)
  coll.ensure_index('score', background=True)
  coll.ensure_index('profit', background=True)
  coll.ensure_index('prov_des', background=True)  # necessary for upcoming pass lookups
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
  print 'Loading delta-v data...'
  reader = csv.DictReader(open(DV_PATH, 'r'))
  deltav_map = {}
  for row in reader:
    deltav_map[row['pdes']] = row['dv']

  print 'Loading small body data...this may take a while'
  print DATA_PATH
  reader = csv.DictReader(open(DATA_PATH), delimiter=',', quotechar='"')
  designation_regex = re.compile('.*\(([^\)]*)\)')
  n = 0
  items = []
  for row in reader:
    row['spec'] = row['spec_B']
    row['full_name'] = row['full_name'].strip()
    if row['spec'] == '':
      newspec = THOLEN_MAPPINGS.get(row['spec_T'], None)
      if newspec:
        row['spec'] = newspec.strip()
      # TODO(@ian) move specific adjustments out into its own file.
      elif row['pdes'] == '2012 DA14':
        print 'Adjust 2012 DA14'
        row['spec'] = 'L'
      elif row['full_name'] == '6178 (1986 DA)':
        print 'Adjust 1986 DA'
        row['spec'] = 'M'
      elif row['full_name'] == '436724 (2011 UW158)':
        print 'Adjust 2011 UW158'
        row['spec'] = 'Xc'
      elif row['class'] in COMET_CLASSES:
        row['spec'] = 'comet'
      else:
        if partial:
          # don't build the full db of 600k objects
          continue
        row['spec'] = '?'

    if row['spec'] == 'C type':
      row['spec'] = 'C'

    # match it with its delta-v
    # TODO(@ian) don't overwrite prov_des, create some unified name field instead.
    m = designation_regex.match(row['full_name'])
    if 'pdes' in row and 'prov_des' not in row:
      row['prov_des'] = row['pdes']  # backwards compatibility for NASA change
    if m:
      # Set delta-v first
      dv = deltav_map.get(row['prov_des'], None)
      if dv:
        row['dv'] = dv
      row['prov_des'] = m.groups()[0]
    else:
      row['prov_des'] = ''

    # Clean up inputs
    for key,val in row.items():
      if val is None: val = ''
      try:
        fv = float(val)
      except ValueError, TypeError:
        row[key] = val.strip()
      else:
        row[key] = fv
    row['spec_T'] = row['spec_T'].replace(':', '')
    row['spec_B'] = row['spec_B'].replace(':', '')
    row['spec'] = row['spec'].replace(':', '')

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

    # TODO move this final scoring pass into scoring.py

    # cap price influence on score at 10 B
    score = min(row['price'], 1e10) / 5e11
    if score > 0.0001:
      score = score + row['closeness'] / 20
    row['score'] = score

    items.append(row)
    n += 1
    if len(items) > 20000:
      # insert into mongo
      print 'Row #', n, '... inserting/updating %d items into asteroids (SBDB) collection' % (len(items))
      coll.insert(items, continue_on_error=True)
      items = []
  # insert into mongo
  print 'Row #', n, '... inserting/updating %d items into asteroids (SBDB) collection' % (len(items))
  coll.insert(items, continue_on_error=True)
  items = []

  print 'Loaded', n, 'asteroids'

def compositions():
  print json.dumps(estimate.SPECTRA_INDEX)
  return estimate.SPECTRA_INDEX

def materials():
  print json.dumps(estimate.MATERIALS_INDEX)
  return estimate.MATERIALS_INDEX

if __name__ == "__main__":
  parser = argparse.ArgumentParser(description='Load data from NASA/JPL SBDB')
  parser.add_argument('--data_path', help='path to sbdb export', default='data/latest_sbdb.csv')
  parser.add_argument('--dv_path', help='path to delta-v calculations', default='data/deltav/db.csv')
  parser.add_argument('--mass_path', help='path to mass data', default='data/masses.txt')
  parser.add_argument('fn', choices=['populateDb', 'populatePartialDb', 'compositions', 'materials'])

  args = vars(parser.parse_args())

  DATA_PATH = args['data_path']
  DV_PATH = args['dv_path']
  MASS_PATH = args['mass_path']

  l = locals()
  fnname = args['fn']
  if fnname in l:
    l[fnname]()
  else:
    print 'No such operation "%s"' % fnname
