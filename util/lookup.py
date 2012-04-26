#!/usr/bin/env python
import sys
import urllib
import re
from bs4 import BeautifulSoup

# TODO  close approach data

class JPL_Asteroid:
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

    self.data['emoid_au'] = r.additionalInfoParameter('Earth MOID')

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
    tag = self.soup.find(text=txt)
    if tag:
      res = re.sub(r'[^\d.]+', '', tag.parent.next_sibling)
      return float(res)
    return -1

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print 'usage: lookup <name>'
    sys.exit(1)
  a = JPL_Asteroid(' '.join(sys.argv[1:]))
  a.load()
