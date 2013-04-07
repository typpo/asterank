import re
import requests
from bs4 import BeautifulSoup

##### Constants

SEARCH_TARGET_URL = 'http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/mobssel.pl?target=%s&NEAT=on&OE_EPOCH=&OE_EC=&OE_QR=&OE_TP=&OE_OM=&OE_W=&OE_IN=&OE_H='

IMAGE_QUERY_URL = 'http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/mobsdisp.pl'

NEAT_FIELDS = ['obs_id', 'triplet', 'time', 'predicted_ra', 'predicted_dec', \
    'center_ra', 'center_dec', 'mag', 'veloc_we', 'veloc_sn', 'offset', \
    'pos_err_major', 'pos_err_minor', 'pos_err_ang', 'pixel_loc_x', \
    'pixel_loc_y', 'key']

NUMERIC_NEAT_FIELDS = set(['mag', 'offset', 'veloc_we', 'veloc_sn', \
    'pixel_loc_x', 'pixel_loc_y'])

URL_BASE = 'http://skyview.gsfc.nasa.gov/'

# The html is so bad that BeautifulSoup won't work
IMAGE_PARSING_REGEX = re.compile("img src='(.*?)'")

##### Functions

def search_target(target):
  # TODO cache

  r = requests.get(SEARCH_TARGET_URL % (target))
  return parse_results_table(r.text)

def parse_results_table(text):
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
    new_entry = {NEAT_FIELDS[i]: newentries[i] for i in range(len(NEAT_FIELDS))}

    for numfield in NUMERIC_NEAT_FIELDS:
      try:
        new_entry[numfield] = float(new_entry[numfield])
      except:
        new_entry[numfield] = -1

    entries.append(new_entry)
  return entries

def get_images(target, key):
  # TODO cache
  params = {
      'Headers_NEAT': '|Observation|Time|ObjRA|ObjDec|Plt RA|Plt Dec|Magnitude|V_RA|V_Dec|E_Maj|E_Min|E_PosAng|x|y|',
      'Check_NEAT': key,
      'Npixel': 500,
      'Singlets': 'on',
      'Scaling': 'Log',
      'Extremum': 'Dft',
      'OverSize': 300,
      'OverScale': 0.5,
      }
  r = requests.post(IMAGE_QUERY_URL, params=params)
  matches = IMAGE_PARSING_REGEX.search(r.text)
  if matches is None:
    return ''
  return matches.group(1)

if __name__ == "__main__":
  #result = search_target('J99TS7A')
  pass
