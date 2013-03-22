import json
import re
import datetime
import pymongo
from pymongo import MongoClient

from calc.jpl_lookup import Asteroid as JPL_Asteroid
import calc.horizon as horizon

conn = MongoClient()
db = conn.asterank
asteroids = db.asteroids
mpc_coll = db.mpc
jpl = db.jpl
kepler_coll = db.kepler
exoplanets_coll = db.exo

UPCOMING_SORT = 'upcoming'

VALID_SORTS = set(['value', 'profit', 'accessibility', 'score', UPCOMING_SORT])

# some of these were poorly named, so we map better names, but the database stays the
# same for backwards compatibility
FIELD_ALIASES = {
  'value': 'price',
  'accessibility': 'closeness',
}

def rankings(sort_by, limit):
  if sort_by not in VALID_SORTS:
    return None
  if sort_by == UPCOMING_SORT:
    return upcoming_passes()
  if sort_by in FIELD_ALIASES:
    sort_by = FIELD_ALIASES[sort_by]
  return list(asteroids.find({}, {'_id': False}) \
          .sort(sort_by, direction=pymongo.DESCENDING) \
          .limit(limit))

def autocomplete(query, limit):
  query = query.replace('+', ' ')
  regx = re.compile(query, re.IGNORECASE)
  ret = list(asteroids.find({'full_name': {'$regex': regx}}, \
          {'_id': False})
          .limit(limit))
  # this sorting is not quite exact, as it penalizes asteroids with
  # long prefix numbers.  But it's close enough.
  return sorted(ret, key=lambda x: x['full_name'].find(query))

def compositions():
  return horizon.compositions()

def upcoming_passes():
  jpl_objs = jpl.find({'Next Pass': {'$exists': True, '$ne': None}, \
    'Next Pass.date_iso': {'$gte': datetime.datetime.now().isoformat()}}, \
    {'_id': False},) \
    .sort('Next Pass.date_iso', direction=pymongo.ASCENDING).limit(30)

  ret = []
  seen = set()
  # TODO this is why the db should be relational...
  for result in jpl_objs:
    if result['tag_name'] in seen:
      continue
    roid = asteroids.find_one({'prov_des': result['tag_name']}, {'_id': False})
    seen.add(result['tag_name'])
    ret.append(roid)

  return ret

def jpl_lookup(query):
  result = jpl.find_one({'tag_name': query}, {'_id': False})
  if not result:
    print 'JPL lookup: %s not found in cache...' % query
    # maybe it's not cached; try querying for it from horizons
    try:
      a = JPL_Asteroid(query)
      a.load()
      print 'JPL lookup: %s loaded from JPL' % query
      result = a.data
      result['tag_name'] = query
      jpl.insert(result)  # cache
      del result['_id']
    except:
      print 'JPL lookup: %s lookup failed' % query
      return None
  else:
    print 'JPL lookup: %s found in cache' % query

  del result['tag_name']
  return result

def mpc(query, limit):
  return list(mpc_coll.find(query, {'_id': False}).limit(limit))

def kepler(query, limit):
  return list(kepler_coll.find(query, {'_id': False}).limit(limit))

def exoplanets(query, limit):
  #return list(exoplanets_coll.find(query, {'_id': False}).limit(limit))

  REQ_TO_DB_MAP = {
    'full_name': 'kepoi_name',
    'prov_des': 'kepoi_name',
    'a': 'koi_sma',
    'e': 'koi_eccen',
    'i': 'koi_incl',
    'w_bar': 'koi_longp',
    'P': 'koi_period',

    # extras
    'p_radius': 'koi_prad',  # planet radius (rearth)
    'p_temp': 'koi_teq',  # equilibrium temperature value (k)
    's_radius': 'koi_srad',  # stellar radius (rsun)
    's_temp': 'koi_steff',  # stellar effective temp (k)
    's_age': 'koi_sage',   # stellar age (Gyr)
  }

  RESP_DEFAULTS = {
    'e': 0.01671122945845127,
    'i': 0,
    'w_bar': 102.93768193,

    'ma': -2.4731102699999923,
    'om': 0,
  }

  for key in query:
    if key in REQ_TO_DB_MAP:
      val = query[key]
      del query[key]
      query[REQ_TO_DB_MAP[key]] = val

  results = list(exoplanets_coll.find(query, {'_id': False}).limit(limit))

  final = []

  for result in results:
    if result['koi_disposition'] != 'FALSE POSITIVE' \
        or result['koi_pdisposition'] != 'FALSE POSITIVE':
      continue

    appendme = {
      # defaults...
      'o': 0,  # long. ascending node
      'ma': 0,   # mean anomaly
      'epoch': 2451545.0,  # j2000
    }
    for key, val in REQ_TO_DB_MAP.iteritems():
      appendme[key] = result[val]
    appendme['a'] *= 20
    appendme['P'] *= 20
    if appendme['i'] != '':
      appendme['i'] -= 90
    for key, default in RESP_DEFAULTS.iteritems():
      if key not in appendme or appendme[key] == '' or appendme[key] == 0:
        appendme[key] = default
    final.append(appendme)
  return final

def asterank(query, limit):
  results = list(asteroids.find(query, {'_id': False}).limit(limit))
  #key_whitelist = set(['a', 'e', 'i', 'om', 'ma', 'spec_B', 'GM', 'dv', ])  # TODO complete
  #results = [{key: asteroid[key] for key in key_whitelist} for asteroid in results]
  return results
