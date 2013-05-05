import sys
import os
import random
import pymongo
from pymongo import Connection
from datetime import datetime
from threading import Thread
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from skymorph import skymorph

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

def create_known_groups():
  # scrape top X objects for imagery
  # a "group" is defined as a series of images taken within 45 minutes of each other
  NUM_CRAWL = 20

  def process(asteroid):
    target = asteroid['prov_des']
    if target.strip() == '':
      target = asteroid['name']
      if target.strip() == '':
        target = asteroid['full_name']
        if target.strip() == '':
          return
    print 'crawl', target

    #skymorph.images_for(prov_des)

    results = skymorph.search_target(target)
    groups = []
    last_group = []
    last_time = None
    for result in results:
      time = datetime.strptime(result['time'], '%Y-%m-%d %H:%M:%S')
      if last_time:
        tdelta = time - last_time if time > last_time else last_time - time
        if tdelta.total_seconds() / 60 > 45:
          # not within 45 minutes of each other
          groups.append(last_group)
          last_group = []
        else:
          last_group.append(result)
      last_time = time

    groups_final_datastructure = []
    gcount = 1
    for group in groups:
      threads = []
      group_results = []
      rcount = 1
      if len(group) < 1:
        continue
      for result in group:
        group_results.append({
          'key': result['key'],
          'time': result['time'],
          'pos_x': 0,
          'pos_y': 0,
          # this will bite me in the ass because these are floats now,
          # but there are some cached responses in which these fields are strs
          'center_ra': skymorph.dms_str_to_float(result['center_ra']),
          'center_dec': skymorph.dms_str_to_float(result['center_dec']),
          })
        #t = Thread(target=skymorph.get_image, args=(result['key'], ))
        #t.start()
        #threads.append(t)
        skymorph.get_fast_image(result['key'])
        print 'Fetching img %d of %d (group %d/%d)' % (rcount, len(group), gcount, len(groups))
        rcount += 1
      gcount +=1
      if len(group_results) > 0:
        groups_final_datastructure.append({
          'score': 0,
          'interesting': 0,
          'not_interesting': 0,
          'images': group_results,
          'reviews': [],
          'target': target,
          'known_target': True,
          })
        #for thread in threads:
        #  thread.join()

    return groups_final_datastructure   # a list of groups

  c = 0
  for asteroid in asteroids.find().sort('score', pymongo.DESCENDING).limit(NUM_CRAWL):
    print 'score #', c
    c += 1
    new_image_groups = process(asteroid)
    if new_image_groups:
      stackblink.insert(new_image_groups)
  c = 0
  for asteroid in asteroids.find().sort('closeness', pymongo.DESCENDING).limit(NUM_CRAWL):
    print 'closeness #', c
    c += 1
    new_image_groups = process(asteroid)
    if new_image_groups:
      stackblink.insert(new_image_groups)
  c = 0
  for asteroid in asteroids.find().sort('price', pymongo.DESCENDING).limit(NUM_CRAWL):
    print 'price #', c
    c += 1
    new_image_groups = process(asteroid)
    if new_image_groups:
      stackblink.insert(new_image_groups)

if __name__ == "__main__":
  create_known_groups()

