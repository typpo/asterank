import requests
from bs4 import BeautifulSoup

SEARCH_TARGET_URL = 'http://skyview.gsfc.nasa.gov/cgi-bin/skymorph/mobssel.pl?target=%s&NEAT=on&OE_EPOCH=&OE_EC=&OE_QR=&OE_TP=&OE_OM=&OE_W=&OE_IN=&OE_H='

NEAT_FIELDS = ['obs_id', 'triplet', 'time', 'predicted_ra', 'predicted_dec', \
    'center_ra', 'center_dec', 'mag', 'veloc_we', 'veloc_sn', 'offset', \
    'pos_err_major', 'pos_err_minor', 'pos_err_ang', 'pixel_loc_x', \
    'pixel_loc_y']

NUMERIC_NEAT_FIELDS = set(['mag', 'offset', 'veloc_we', 'veloc_sn', \
    'pixel_loc_x', 'pixel_loc_y'])

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

if __name__ == "__main__":
  result = search_target('J99TS7A')
