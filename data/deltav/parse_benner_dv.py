#!/usr/bin/env python
#
# Parses delta v file from Lance Benner
# @ http://echo.jpl.nasa.gov/~lance/delta_v/delta_v.rendezvous.html
#

import re
import sys
import urllib2

if len(sys.argv) > 1:
  TARGET = sys.argv[1]
  #TARGET = 'dv.2013.04.14'

  f = open(TARGET, 'r')
  lines = f.readlines()
  f.close()
else:
  lines = urllib2.urlopen('http://echo.jpl.nasa.gov/~lance/delta_v/delta_v.rendezvous.html').read().splitlines()

r = re.compile('\s*(?P<rank>\d+)\s+(?P<percentile>\d+\.\d+)\s+(?P<name>\(\d+\)(\s+[-\w ]+)?)?\s+(?P<pdes1>\d+)\s+(?P<pdes2>[-\w]+)\s+(?P<deltav>\d+\.\d+)\s+(?P<h>\d+\.\d+)\s+(?P<a>\d+\.\d+)\s+(?P<e>\d+\.\d+)\s+(?P<i>\d+\.\d+)')
c = 0
for line in lines:
  c+=1
  if c < 4:
    continue

  m = r.match(line)
  if not m:
    continue

  print '%s %s,%s' % (m.group('pdes1'), m.group('pdes2'), m.group('deltav'))
