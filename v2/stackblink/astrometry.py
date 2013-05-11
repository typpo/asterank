import tempfile
import time
import shutil
from subprocess import call
from shove import Shove

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from util import md5_storage_hash

store = Shove( \
    'file:///var/asterank/neat_astrometry_store', \
    'file:///var/asterank/neat_astrometry_cache')

def process(png_data, ra, dec, key):
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
  wcs = f_wcs.read()
  f_wcs.close()

  shovekey = 'neat_wcs_%s' % md5_storage_hash(key)
  store[shovekey] = wcs

  # delete temp file
  f.close()
  # and the temp directory
  shutil.rmtree(output_dir)
