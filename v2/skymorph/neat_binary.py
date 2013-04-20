# Direct, fast processing for binary NEAT imagery

import png
import os
import sys
import urllib2
import io
from PIL import Image, ImageEnhance

BASE_URL = 'http://kaspar.jpl.nasa.gov/cgi-bin'
ENDPOINT = '/extract_subset.pl'
QUERY_FORMAT = '?Id=%s&X0=%d&Y0=%d&Nx=%d&Ny=%d'

def process_from_internet(id, x0, y0, width, height):
  print 'Loading ...'
  formatted_query = QUERY_FORMAT % (id, x0, y0, width, height)
  URL = '%s%s%s' % (BASE_URL, ENDPOINT, formatted_query)
  req = urllib2.urlopen(URL)
  buffer = io.BytesIO(req.read())
  print 'Processing ...'

  output_buffer = io.BytesIO()
  process(buffer, output_buffer)
  return output_buffer.getvalue()


def process_file(path, output_path):
  f = open(path, 'rb')
  ret = process(f, output_path)
  f.close()
  return output_path

# f: incoming buffer for initial byte data
# final_output: can be a file path or a buffer
def process(f, final_output):
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
  if width > 10000:
    print 'Too big. Something went wrong!'
    return None

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

  # Write initial output
  output_buffer = io.BytesIO()
  w = png.Writer(width, height, greyscale=True, bytes_per_sample=bytes_per_pixel)
  w.write(output_buffer, rows)

  # Post process for sharpness ...
  output_buffer.seek(0)
  im = Image.open(output_buffer)

  # Solves "image has wrong mode" error
  im.convert('I')
  im = im.point(lambda i:i*(1./256)).convert('L')

  # Improve contrast to bring out faint stars
  enhancer = ImageEnhance.Contrast(im)
  im = enhancer.enhance(20)
  if type(final_output) == str:
    im.save(final_output)    # use specified file format
  else:
    im.save(final_output, 'png')

if __name__ == "__main__":
  if len(sys.argv) > 2:
    process_file(sys.argv[1], sys.argv[2])
  else:
    process_from_internet('001204131418', 0, 300, 500, 500, 'output.png')
    #process_from_internet('001230104606', 2063.06, 1965.86, 500, 500, 'output.png')
