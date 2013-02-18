import json
import re
import pymongo
from pymongo import MongoClient

from calc.jpl_lookup import Asteroid as JPL_Asteroid

conn = MongoClient()
db = conn.asterank
asteroids = db.asteroids
mpc = db.mpc
jpl = db.jpl

VALID_SORTS = set(['value', 'profit', 'accessibility', 'score'])

# some of these were poorly named, so we map better names, but the database stays the
# same for backwards compatibility
FIELD_ALIASES = {
  'value': 'price',
  'accessibility': 'closeness',
}

def rankings(sort_by, limit):
  if sort_by not in VALID_SORTS:
    return None
  if sort_by in FIELD_ALIASES:
    sort_by = FIELD_ALIASES[sort_by]
  return list(asteroids.find({}, {'_id': False}) \
          .sort(sort_by, direction=pymongo.DESCENDING) \
          .limit(limit))

def autocomplete(query, limit):
  query = query.replace('+', ' ')
  regx = re.compile(query, re.IGNORECASE)
  return list(asteroids.find({'full_name': {'$regex': regx}}, \
          {'_id': False})
          .limit(limit))

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
