#!/usr/bin/env python
import sys
import urllib
from bs4 import BeautifulSoup

# TODO  close approach data
#       earth MOID


class Asteroid:
  def __init__(self, name):
    self.name = name

  def load(self):
    r = Query(self.name)

    self.data = {}
    self.data['diameter_km'] = r.physicalParameter('diameter')
    self.data['gm'] = r.physicalParameter('GM')
    self.data['density'] = r.physicalParameter('bulk density')

    self.data['passage_jed'] = r.orbitalParameter('t')
    self.data['perhilion_au'] = r.orbitalParameter('q')
    self.data['semimajor_au'] = r.orbitalParameter('a')
    self.data['period_days'] = r.orbitalParameter('period')

    print self.data

class Query:
  def __init__(self, query):
    src = urllib.urlopen('http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=%s;cad=1' % query ).read()
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

  def additionalInfoParameter(self, txt):
    pass

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print 'usage: lookup <name>'
    sys.exit(1)
  a = Asteroid(' '.join(sys.argv[1:]))
  a.load()
