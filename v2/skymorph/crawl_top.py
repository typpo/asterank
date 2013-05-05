#!/usr/bin/env python
#
# This crawls skymorph imagery for top asteroid results.
# Normally we do this on-demand when the user selects an asteroid,
# but we pre-crawl info for the more popular ones.
#
# TODO this only crawls objects with prov_des set in JPL SBDB

import skymorph
import pymongo
from pymongo import Connection

NUM_CRAWL = 100
connection = Connection('localhost', 27017)
db = connection.asterank

asteroids = db.asteroids
jpl = db.jpl
def process(asteroid):
  prov_des = asteroid['prov_des']
  if prov_des.strip() == '':
    return
  print 'crawl', prov_des
  skymorph.images_for(prov_des)


for asteroid in asteroids.find().sort('price', pymongo.DESCENDING).limit(NUM_CRAWL):
  process(asteroid)
for asteroid in asteroids.find().sort('score', pymongo.DESCENDING).limit(NUM_CRAWL):
  process(asteroid)
for asteroid in asteroids.find().sort('closeness', pymongo.DESCENDING).limit(NUM_CRAWL):
  process(asteroid)
