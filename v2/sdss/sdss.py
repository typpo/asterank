# SDSS query interface
# TODO make this a common interface that NEAT images can share too
#

import os
import cStringIO as StringIO
from random import choice
from PIL import Image

SURVEY_ID = 'sdss'

DATA_DIR = 'data'
FILE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(FILE_DIR, DATA_DIR)

data_index = {}    # map from original file to a list of its RGB splits
data_index_reverse = {}
data_index_size = 0
data_index_keys = []

all_files = []
for root, subFolders, files in os.walk(DATA_PATH):
  for file in files:
    f = os.path.relpath(os.path.join(root, file), FILE_DIR)
    if not f.endswith('.jpg'): continue
    if f.endswith('split.jpg'):
      key = f[:-12] + '.jpg'
      data_index.setdefault(key, [])
      data_index[key].append(f)
      data_index_reverse[f] = key
    else:
      data_index.setdefault(f, [])

data_index_keys = data_index.keys()
data_index_size = len(data_index_keys)

# Prune bad entries
for key in data_index_keys:
  if len(data_index[key]) < 2:
    del data_index[key]

def get_unknown_group():
  # Return random rgb group
  keys = data_index[choice(data_index_keys)]
  ret_keys = [{'key': key, 'offset_x': 0, 'offset_y': 0} for key in keys]
  return {'survey': SURVEY_ID, 'images': ret_keys}

def get_control_group():
  # placeholder for when I set up a real API for image sources
  pass

def image_from_key(key):
  # TODO this should really be static. This is awful.
  if key in data_index_reverse:
    im = Image.open(os.path.join(FILE_DIR, key))
    # Scale for now
    im.thumbnail((661, 454), Image.ANTIALIAS)   #  1/3 size
    output = StringIO.StringIO()
    im.save(output, format='PNG')
    return output.getvalue()
  return None
