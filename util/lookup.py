#!/usr/bin/env python
import sys
import urllib
from bs4 import BeautifulSoup


def lookup(query):
  r = Query(query)

  data = {}
  data['diameter_km'] = r.physicalParameter('diameter')
  data['gm'] = r.physicalParameter('GM')
  data['density'] = r.physicalParameter('bulk density')

  data['passage_jed'] = r.orbitalParameter('t')
  data['perhilion_au'] = r.orbitalParameter('q')
  data['semimajor_au'] = r.orbitalParameter('a')
  data['period_days'] = r.orbitalParameter('period')

  print data

class Query:
  def __init__(self, query):
    src = urllib.urlopen('http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=%s' % query ).read()
    self.soup = BeautifulSoup(src.replace('cellspacing="0"0', ''))

  def orbitalParameter(self, txt):
    tag = self.soup.find(text=txt)
    if tag :
      el = tag.find_parent('td').next_sibling.next_sibling.find('font').next
      return float(el)
    return -1

  def physicalParameter(self, txt):
    tag = self.soup.find(text=txt)
    if tag:
      el = tag.find_parent('td').next_sibling.next_sibling.next_sibling.next_sibling.find('font').next
      return float(el)
    return -1

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print 'usage: lookup <name>'
    sys.exit(1)
  lookup(' '.join(sys.argv[1:]))
