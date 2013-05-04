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
  NUM_CRAWL = 1000
  connection = Connection('localhost', 27017)
  db = connection.asterank

  asteroids = db.asteroids
  jpl = db.jpl
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

    results = search_target(target)
    threads = []
    ret = []
    for result in results[-1*10:]:
      ret.append({
        'key': result['key'],
        'time': result['time'],
        })
      t = Thread(target=get_image, args=(result['key'], ))
      t.start()
      threads.append(t)
    for thread in threads:
      thread.join()
    return ret


  for asteroid in asteroids.find().sort('price', pymongo.DESCENDING).limit(NUM_CRAWL):
    process(asteroid)
  for asteroid in asteroids.find().sort('score', pymongo.DESCENDING).limit(NUM_CRAWL):
    process(asteroid)
  for asteroid in asteroids.find().sort('closeness', pymongo.DESCENDING).limit(NUM_CRAWL):
    process(asteroid)

