import subprocess, datetime, os, time, signal
import tempfile
import time
import shutil
from StringIO import StringIO
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

  print 'Solving field for', key, '...'
  result = _timeout_command('solve-field --no-plots --cpulimit 30 -o solution --scale-units degwidth --scale-low 0 --scale-high 2 %s --ra %f --dec %f --radius 1 -D %s' \
      % (png_path, ra, dec, output_dir), 60)

  if not result:
    print '\033[91m Could not solve field\033[0m'
    return None
  print 'Done solving field'

  wcs_path = output_dir + '/solution.new'
  try:
    f_wcs = open(wcs_path, 'r')
  except:
    print "\033[91m Couldn't open solution file\033[0m"
    print wcs_path
    x = raw_input('Investigate, then press enter: ')

    return None
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

  wcs1 = astWCS.WCS(StringIO(store[shove_key1]))
  x1, y1 = wcs1.wcs2pix(reference_ra, reference_dec)
  wcs2 = astWCS.WCS(StringIO(store[shove_key2]))
  x2, y2 = wcs2.wcs2pix(reference_ra, reference_dec)

  """
  try:
    wcs1 = astWCS.WCS(StringIO(store[shove_key1]))
    x1, y1 = wcs1.wcs2pix(reference_ra, reference_dec)
  except:
    print store[shove_key1]
    del store[shove_key1]
    return None
  try:
    wcs2 = astWCS.WCS(StringIO(store[shove_key2]))
    x2, y2 = wcs2.wcs2pix(reference_ra, reference_dec)
  except:
    print store[shove_key2]
    del store[shove_key2]
    return None
  """

  return x2-x1, y2-y1

def _timeout_command(command, timeout):
  """call shell-command and either return its output or kill it
  if it doesn't normally exit within timeout seconds and return None"""
  start = datetime.datetime.now()
  process = subprocess.Popen(command, stdout=subprocess.PIPE, \
      stderr=subprocess.PIPE, shell=True, preexec_fn=os.setsid)
  while process.poll() is None:
    time.sleep(0.1)
    now = datetime.datetime.now()
    if (now - start).seconds > timeout:
      os.killpg(process.pid, signal.SIGTERM)
      os.waitpid(-1, os.WNOHANG)
      return None
  return process.stdout.read()
