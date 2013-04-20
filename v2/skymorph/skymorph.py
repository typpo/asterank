import re
import urlparse
import requests
import json
import neat_binary
from redis import StrictRedis
from bs4 import BeautifulSoup

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

URL_BASE = 'http://skyview.gsfc.nasa.gov/'

IMAGE_SIZE = 500   # pixels

# The html is so bad that BeautifulSoup won't work, so we parse with a regex
IMAGE_PARSING_REGEX = re.compile("img src='(.*?)'")

##### Redis Config
REDIS_PREFIX = 'skymorph'
redis = StrictRedis(host='localhost', port=6379, db=3)

##### Functions

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

    entries.append(new_entry)
  return entries

def get_fast_image(key):
  data = key.split('|')
  id = data[0]
  x = data[11]
  y = data[12]
  width = height = IMAGE_SIZE
  x0 = x - IMAGE_SIZE/2
  y0 = y - IMAGE_SIZE/2
  ret = process_from_internet(id, x0, y0, width, height)
  # TODO return ret binary as image


def get_image(key):
  info = get_image_info(key)
  if info and 'url' in info:
    r = requests.get(info['url'])
    return r.content
  return info

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
