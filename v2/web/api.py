import pymongo
from pymongo import MongoClient

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
