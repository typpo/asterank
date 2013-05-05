import sys
import os
import pymongo
from pymongo import Connection
from datetime import datetime
from threading import Thread
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from skymorph import skymorph

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
  # a "group" is defined as a series of images taken within 45 minutes of each other
  NUM_CRAWL = 1000
  connection = Connection('localhost', 27017)
  db = connection.asterank
  asteroids = db.asteroids
  stackblink = db.stackblink

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
    for group in groups:
      threads = []
      group_results = []
      for result in group:
        group_results.append({
          'key': result['key'],
          'time': result['time'],

          # this will bite me in the ass because these are floats now,
          # but there are some cached responses in which these fields are strs
          'center_ra': skymorph.dms_str_to_float(result['center_ra']),
          'center_dec': skymorph.dms_str_to_float(result['center_dec']),
          })
        t = Thread(target=skymorph.get_image, args=(result['key'], ))
        t.start()
        threads.append(t)
      if len(group_results) > 0:
        groups_final_datastructure.append({
          'score': 0,
          'pos_x': 0,
          'pos_y': 0,
          'images': group_results,
          'reviews': [],
          })
        for thread in threads:
          thread.join()

    return {
      'target': target,
      'groups': groups_final_datastructure,
    }

  for asteroid in asteroids.find().sort('price', pymongo.DESCENDING).limit(NUM_CRAWL):
    target_object = process(asteroid)
    stackblink.insert(target_object)
  for asteroid in asteroids.find().sort('score', pymongo.DESCENDING).limit(NUM_CRAWL):
    target_object = process(asteroid)
    stackblink.insert(target_object)
  for asteroid in asteroids.find().sort('closeness', pymongo.DESCENDING).limit(NUM_CRAWL):
    target_object = process(asteroid)
    stackblink.insert(target_object)

if __name__ == "__main__":
  create_known_groups()

