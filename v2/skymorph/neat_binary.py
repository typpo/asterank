#
# Direct processing for binary NEAT imagery
#

import png
import os
import sys
import urllib2
import tempfile
from PIL import Image, ImageEnhance

BASE_URL = 'http://kaspar.jpl.nasa.gov/cgi-bin'
ENDPOINT = '/extract_subset.pl'
QUERY_FORMAT = '?Id=%s&X0=%d&Y0=%d&Nx=%d&Ny=%d'

def load_url(id, x0, y0, width, height):
  formatted_query = QUERY_FORMAT % (id, x0, y0, width, height)
  URL = '%s%s%s' % (BASE_URL, ENDPOINT, formatted_query)
  req = urllib2.urlopen(URL)
  CHUNK = 16 * 1024
  file = tempfile.NamedTemporaryFile(delete=False)
  with file as fp:
    while True:
      chunk = req.read(CHUNK)
      if not chunk: break
      fp.write(chunk)
  return os.path.abspath(file.name)

def process_from_internet(id, x0, y0, width, height, output_path):
  print 'Loading url...'
  path = load_url(id, x0, y0, width, height)
  print 'Building image...'
  process(path, output_path)
  os.remove(path)

def process(path, output_path):
  f = open(path, 'rb')
  header_vals = []
  for c in range(5):
    bytes = f.read(4)
    hexstr = ''.join(["{0:x}".format(ord(b)) for b in bytes])
    intval = int(hexstr, 16)
    header_vals.append(intval)

  start_x = header_vals[0]
  start_y = header_vals[1]
  end_x = header_vals[2]
  end_y = header_vals[3]
  width = end_x# - start_x
  height = end_y# - start_y
  bits_per_pixel = header_vals[4]
  bit_range = 2 ** bits_per_pixel
  bytes_per_pixel = bits_per_pixel / 8

  print 'Parsing %dx%d file at %d bytes per pixel' % (width, height, bytes_per_pixel)

  rows = []
  last_colored_int = 0
  for y in range(height):
    row = []
    for x in range(width):
      pixel = f.read(bytes_per_pixel)
      if pixel == '':
        print 'EOF before expected'
        break
      hexstr = ''.join(["{0:x}".format(ord(b)) for b in pixel])
      intval = int(hexstr, 16)
      if intval <= 4000:
        intval = last_colored_int
      else:
        last_colored_int = intval
      row.append(intval)
    rows.append(row)

  f.close()  # close input

  # Write output
  f = open(output_path, 'wb')
  w = png.Writer(width, height, greyscale=True, bytes_per_sample=bytes_per_pixel)
  w.write(f, rows)
  f.close()

  # Post process for sharpness
  im = Image.open(output_path)

  # Solves "image has wrong mode" error
  im.convert('I')
  im = im.point(lambda i:i*(1./256)).convert('L')

  enhancer = ImageEnhance.Contrast(im)
  im = enhancer.enhance(20)
  im.save(output_path)

if __name__ == "__main__":
  if len(sys.argv) > 2:
    process(sys.argv[1], sys.argv[2])
  else:
    process_from_internet('001204131418', 0, 300, 500, 500, 'output.png')
    #process_from_internet('001230104606', 2063.06, 1965.86, 500, 500, 'output.png')
