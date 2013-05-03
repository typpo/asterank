#!/usr/bin/env python
#
# Parses delta v file from Lance Benner
# @ http://echo.jpl.nasa.gov/~lance/delta_v/delta_v.rendezvous.html
#

import csv
import re
import StringIO
import sys
import urllib2

BENNER_URL = 'http://echo.jpl.nasa.gov/~lance/delta_v/delta_v.rendezvous.html'

def process_from_internet():
  data = urllib2.urlopen(BENNER_URL).read()
  return process(data)

def process(text):
  lines = text.splitlines()
  r = re.compile((
      '\s*(?P<rank>\d+)'
      '\s+(?P<percentile>\d+\.\d+)'
      '\s+(?P<name>\(\d+\)(\s+[-\w ]+)?)?'
      '\s+(?P<pdes1>\d+)'
      '\s+(?P<pdes2>[-\w]+)'
      '\s+(?P<deltav>\d+\.\d+)'
      '\s+(?P<h>\d+\.\d+)'
      '\s+(?P<a>\d+\.\d+)'
      '\s+(?P<e>\d+\.\d+)'
      '\s+(?P<i>\d+\.\d+)'))
  c = 0
  buf = StringIO.StringIO()
  fields = ('pdes', 'dv', 'H', 'a', 'e', 'i')
  writer = csv.DictWriter(buf, fields)
  writer.writeheader()
  for line in lines:
    c+=1
    if c < 4:
      continue

    m = r.match(line)
    if not m:
      continue

    writer.writerow({
        'pdes': ('%s %s' % (m.group('pdes1'), m.group('pdes2'))).strip(),
        'dv': m.group('deltav'),
        'H': m.group('h'),
        'a': m.group('a'),
        'e': m.group('e'),
        'i': m.group('i')
        })
  return buf.getvalue()

if __name__ == "__main__":
  if len(sys.argv) > 1:
    TARGET = sys.argv[1]
    #TARGET = 'dv.2013.04.14'

    f = open(TARGET, 'r')
    data = f.read()
    f.close()
    print process(data)
  else:
    print process_from_internet()
