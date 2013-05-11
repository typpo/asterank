#!/usr/bin/env python
import sys
import os
import random
import pymongo
import astrometry
from pymongo import Connection
from datetime import datetime
from threading import Thread
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from skymorph import skymorph

connection = Connection('localhost', 27017)
db = connection.asterank
asteroids = db.asteroids
stackblink = db.stackblink

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
      if len(group) < 2:
        continue
      for result in group:
        center_ra = skymorph.hms_str_to_float(result['center_ra'])
        center_dec = skymorph.dms_str_to_float(result['center_dec'])
        new_group_result = {
          'key': result['key'],
          'time': result['time'],
          'pos_x': 0,
          'pos_y': 0,
          # this will bite me in the ass because these are floats now,
          # but there are some cached responses in which these fields are strs
          'center_ra': center_ra,
          'center_dec': center_dec,
          }
        print 'Fetching img %d of %d (group %d/%d)' % (rcount, len(group), gcount, len(groups))
        png_data = skymorph.get_fast_image(result['key'])
        print result['key']
        wcs_text = astrometry.process(png_data, center_ra, center_dec, result['key'])
        group_results.append(new_group_result)
        rcount += 1
      gcount +=1
      if len(group_results) > 1:
        ref_ra = group_results[0]['center_ra']
        ref_dec  = group_results[0]['center_dec']
        for result in group_results:
          offset = astrometry.get_pixel_offset(result['key'], group_results[0]['key'], \
              ref_ra, ref_dec)
          if not offset:
            print '!! ERROR: skipping image for', target, \
                'because it has not had its astrometry processed.', result['key']
            continue
          result['offset_x'] = offset[0]
          result['offset_y'] = offset[1]
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

