import math
import re
import urlparse
import requests
import json
import neat_binary
from threading import Thread, Lock
from util import md5_storage_hash
from redis import StrictRedis
from bs4 import BeautifulSoup
from shove import Shove

##### Constants

SEARCH_TARGET_URL = 'http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/mobssel.pl?target=%s&NEAT=on&OE_EPOCH=&OE_EC=&OE_QR=&OE_TP=&OE_OM=&OE_W=&OE_IN=&OE_H='

SEARCH_EPHEM_URL = 'http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/mobssel.pl?target=&NEAT=on&OE_EPOCH=%s&OE_EC=%s&OE_QR=%s&OE_TP=%s&OE_OM=%s&OE_W=%s&OE_IN=%s&OE_H=%s'

SEARCH_POS_URL = 'http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/obssel.pl?position=%s,%s&time=%s&time_delta=1'

IMAGE_QUERY_URL = 'http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/mobsdisp.pl'

NEAT_FIELDS_LARGE = ['obs_id', 'triplet', 'time', 'predicted_ra', 'predicted_dec', \
    'center_ra', 'center_dec', 'mag', 'veloc_we', 'veloc_sn', 'offset', \
    'pos_err_major', 'pos_err_minor', 'pos_err_ang', 'pixel_loc_x', \
    'pixel_loc_y', 'key']

NEAT_FIELDS_SMALL = ['obs_id', 'ra', 'dec', 'time', 'exposure', 'triplet', 'key']

NUMERIC_NEAT_FIELDS = set(['mag', 'offset', 'veloc_we', 'veloc_sn', \
    'pixel_loc_x', 'pixel_loc_y'])

DMS_NEAT_FIELDS = set(['center_dec', 'predicted_dec'])
HMS_NEAT_FIELDS = set(['center_ra', 'predicted_ra'])

URL_BASE = 'http://skyview.gsfc.nasa.gov/'

IMAGE_SIZE = 500   # pixels

# The html is so bad that BeautifulSoup won't work, so we parse with a regex
IMAGE_PARSING_REGEX = re.compile("img src='(.*?)'")

##### Redis Config
REDIS_PREFIX = 'skymorph'
redis = StrictRedis(host='localhost', port=6379, db=3)

##### Disk cache config
# TODO these should be changed to absolute paths so we can get rid of the
# symlinks in stackblink
store = Shove('file://skymorph_store', 'file://skymorph_cache')
store_mutex = Lock()

##### Functions

def images_for(target, n=10):
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

def search_target(target):
  target = target.upper()
  redis_key = '%s:target:%s' % (REDIS_PREFIX, target)

  cached = redis.get(redis_key)
  if cached:
    return json.loads(cached)
  else:
    r = requests.get(SEARCH_TARGET_URL % (target))
    results = parse_results_table(r.text, NEAT_FIELDS_LARGE)
    redis.set(redis_key, json.dumps(results))
    return results

def search_ephem(epoch, ecc, per, per_date, om, w, inc, h):
  params_joined = ','.join([epoch, ecc, per, per_date, om, w, inc, h])
  redis_key = '%s:ephem:%s' % (REDIS_PREFIX, params_joined)
  cached = redis.get(redis_key)
  if cached:
    return json.loads(cached)
  else:
    r = requests.get(SEARCH_EPHEM_URL % (epoch, ecc, per, per_date, om, w, inc, h))
    results = parse_results_table(r.text, NEAT_FIELDS_LARGE)
    redis.set(redis_key, json.dumps(results))
    return results

def search_position(ra, dec, time):
  # http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/obssel.pl?position=08+36+15.06%2C04+38+24.1&time=2000-12-04+12%3A44%3A20&time_delta=1
  params_joined = ','.join([ra, dec, time])
  redis_key = '%s:pos:%s' % (REDIS_PREFIX, params_joined)
  cached = redis.get(redis_key)
  if cached:
    return json.loads(cached)
  else:
    if dec.startswith('+'):
      dec = dec[1:]   # with comma separator (used in url), + is assumed
    r = requests.get(SEARCH_POS_URL % (ra, dec, time))
    results = parse_results_table(r.text, NEAT_FIELDS_SMALL)
    redis.set(redis_key, json.dumps(results))
    return results

def parse_results_table(text, neat_fields):
  soup = BeautifulSoup(text)

  main_table = soup.find('table')
  if not main_table:
    return []
  rows = main_table.findAll('tr')[2:]

  cols_per_row = [row.findAll('td') for row in rows]

  entries = []
  for row in cols_per_row:
    newentries = [col.findAll(text=True) for col in row]
    newentries.append([[col.find('input') for col in row][0]['value']])   # value for follow-up query
    newentries = [x[0].strip().replace(u'\xa0', u' ').replace(u'\xc2', u' ')\
        for x in newentries if len(x) == 1 and x[0].strip() != '']
    new_entry = {neat_fields[i]: newentries[i] for i in range(len(neat_fields))}
    for numfield in NUMERIC_NEAT_FIELDS:
      try:
        new_entry[numfield] = float(new_entry[numfield])
      except:
        new_entry[numfield] = -1

    for dmsfield in DMS_NEAT_FIELDS:
      new_entry[dmsfield] = dms_str_to_float(new_entry[dmsfield])
    for hmsfield in HMS_NEAT_FIELDS:
      new_entry[hmsfield] = hms_str_to_float(new_entry[hmsfield])

    entries.append(new_entry)
  return entries

def hms_str_to_float(hmsfield):
  try:
    h, m, s = hmsfield.split(' ')
    h = float(h)
    m = float(m)
    s = float(s)
    return h * 15 + m / 4 + s / 240
  except:
    return hmsfield

def dms_str_to_float(dmsfield):
  try:
    d, m, s = dmsfield.split(' ')
    d = float(d)
    m = float(m)
    s = float(s)
    return math.copysign(1, d) * (abs(d) + (m / 60.0) + (s / 3600.0));
  except:
    return dmsfield

def get_fast_image(key):
  # This is not terribly fast, but if the archive's image is not fast,
  # this will load much much faster. If the image is cached, it will load
  # at about the same speed.
  # Pros: faster.
  # Cons: not "official" skymorph post-processing. The initial bytes are the same,
  # but the sharpness/contrast improvements are done by the API, not by NASA.
  storage_key = 'fast_%s' % (md5_storage_hash(key))
  store_mutex.acquire()
  if storage_key in store:
    store_mutex.release()
    return store[storage_key]
  store_mutex.release()
  data = [x for x in key.split('|') if x.strip() != '']
  id = data[0]
  x = float(data[12])
  y = float(data[13])
  width = height = IMAGE_SIZE
  x0 = max(0, x - IMAGE_SIZE/2.)
  y0 = max(0, y - IMAGE_SIZE/2.)
  ret = neat_binary.process_from_internet(id, x0, y0, width, height)
  store_mutex.acquire()
  store[storage_key] = ret
  store_mutex.release()
  return ret

def get_image(key):
  storage_key = 'skymorph_%s' % (md5_storage_hash(key))
  store_mutex.acquire()
  if storage_key in store:
    store_mutex.release()
    return store[storage_key]
  store_mutex.release()
  info = get_image_info(key)
  if info and 'url' in info:
    r = requests.get(info['url'])
    ret = r.content
  else:
    ret = info
  store_mutex.acquire()
  store[storage_key] = ret
  store_mutex.release()
  return ret

def get_image_info(key):
  redis_key = '%s:images:%s' % (REDIS_PREFIX, key)
  cached = redis.get(redis_key)
  if cached:
    # TODO cache in s3.  Right now we are caching temporary urls,
    # so need to check if they're still valid
    json_obj = json.loads(cached)
    r = requests.head(json_obj['url'])
    if r.status_code == 200:
      return json_obj

  # omitting target param, it doesn't seem necessary
  params = {
      'Headers_NEAT': '|Observation|Time|ObjRA|ObjDec|Plt RA|Plt Dec|Magnitude|V_RA|V_Dec|E_Maj|E_Min|E_PosAng|x|y|',
      'Check_NEAT': key,
      'Npixel': IMAGE_SIZE,
      'Singlets': 'on',
      'Scaling': 'Log',
      'Extremum': 'Dft',
      'OverSize': 300,
      'OverScale': 0.5,
      }
  r = requests.post(IMAGE_QUERY_URL, params=params)
  matches = IMAGE_PARSING_REGEX.search(r.text)
  if matches is None:
    return {'success': False}

  result = {'success': True, 'url': urlparse.urljoin(URL_BASE, matches.group(1))}
  redis.set(redis_key, json.dumps(result))
  return result

if __name__ == "__main__":
  #result = search_target('J99TS7A')
  #get_images('', '|001204124410|51882.530787037|129.062741402712|4.64001695570385|128.337645|4.0726|20.70|-4.28|-11.08|n.a.|n.a.|n.a.|71.9154214757038|547.287989060186|y|')

  pass
