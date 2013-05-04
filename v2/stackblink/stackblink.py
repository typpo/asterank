from skymorph import skymorph
from pymongo import MongoClient

def fetch_group():
  # Returns a group of images for stacking/blinking

  rets = []
  # internally, each image has a score weighted by yesses and nos.  Eventually
  # people's votes will count for more or less.
  rets.append({
    'image_url': 'http://...',

    # best guess at initial positioning, based on past feedback
    'pos_x': 0,
    'pos_y': 0,

    })
  return rets

def update_group(id, positions, interesting):
  # add crowdsourced info to group
  pass

def create_known_groups():
  # scrape top X objects for imagery
  # a "group" is defined as a series of images taken within half an hour of each other
  pass

