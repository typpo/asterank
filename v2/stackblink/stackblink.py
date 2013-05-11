import sys
import os
import random
import pymongo
from pymongo import Connection
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

connection = Connection('localhost', 27017)
db = connection.asterank
asteroids = db.asteroids
stackblink = db.stackblink

def get_control_groups():
  # Returns a group of images for stacking/blinking

  # Choose a random target
  count = stackblink.count()
  control_object = stackblink.find({}, {'_id': False}).limit(-1) \
      .skip(random.randint(0, count-1)).next()
  # TODO  handle no groups
  return control_object

def update_group(id, positions, interesting):
  # add crowdsourced info to group
  # update pos_x, pos_y, reviews, score
  pass
