#!/usr/bin/env python

import csv
import telnetlib

DATA_PATH = 'data/fulldb.csv'

print 'Loading small body data...this may take a little bit'
reader = csv.DictReader(open(DATA_PATH), delimiter=',', quotechar='"')
n = 0
for row in reader:
  n += 1

print 'Loaded', n, 'asteroids'


def telnetLookup():
  t = telnetlib.Telnet()
  t.open('horizons.jpl.nasa.gov', 6775)
  t.read_very_eager()
