import json
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
  return asteroids.find({}, {'_id': False}) \
          .sort(sort_by, direction=pymongo.DESCENDING) \
          .limit(limit)

def jpl_lookup(query):
  ret = jpl.find({'tag_name': query}, {'_id': False}).limit(1)
  if not ret:
    # maybe it's not cached; try querying for it from horizons
    a = JPL_Asteroid(query)
    a.load()
    ret = a.data
    ret.tag_name = query
    jpl.insert(a.data)  # cache
  return ret
