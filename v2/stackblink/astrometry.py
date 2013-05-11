import tempfile
import time
import shutil
from StringIO import StringIO
from subprocess import call
from shove import Shove

from astLib import astWCS

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from util import md5_storage_hash

store = Shove( \
    'file:///var/asterank/neat_astrometry_store', \
    'file:///var/asterank/neat_astrometry_cache')

def process(png_data, ra, dec, key):
  """
  Returns astrometry data for a given sky image.
  """
  shovekey = 'neat_wcs_%s' % md5_storage_hash(key)
  if shovekey in store:
    return store[shovekey]

  # write png to temp file
  f = tempfile.NamedTemporaryFile(prefix='astrometry_')
  f.write(png_data)
  f.flush()

  output_dir = tempfile.mkdtemp(prefix='astrometry_results_')

  png_path = f.name
  call('solve-field --no-plots --cpulimit 60 -o solution --scale-units degwidth --scale-low 0 --scale-high 2 %s --ra %f --dec %f --radius 1 -D %s' \
      % (png_path, ra, dec, output_dir), shell=True)
  print 'Done solving field'

  wcs_path = output_dir + '/solution.wcs'
  f_wcs = open(wcs_path, 'r')
  wcs_text = f_wcs.read()
  f_wcs.close()

  store[shovekey] = wcs_text

  # delete temp file
  f.close()
  # and the temp directory
  shutil.rmtree(output_dir)

  return wcs_text

def get_pixel_offset(image_key1, image_key2, reference_ra, reference_dec):
  """
  Returns an (X, Y) tuple of pixel offsets to transform key1 to key2.
  reference_ra and reference_dec must appear in both images.
  """

  shove_key1 = 'neat_wcs_%s' % md5_storage_hash(image_key1)
  shove_key2 = 'neat_wcs_%s' % md5_storage_hash(image_key2)

  if shove_key1 not in store or shove_key2 not in store:
    print "get_pixel_offset: couldn't find matching keys in store - are you sure they've been processed?"
    return None

  try:
    wcs1 = astWCS.WCS(StringIO(store[shove_key1]))
    x1, y1 = wcs1.wcs2pix(reference_ra, reference_dec)
  except:
    del store[shove_key1]
    return None
  try:
    wcs2 = astWCS.WCS(StringIO(store[shove_key2]))
    x2, y2 = wcs2.wcs2pix(reference_ra, reference_dec)
  except:
    del store[shove_key2]
    return None

  return x2-x1, y2-y1
