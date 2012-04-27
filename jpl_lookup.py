#!/usr/bin/env python
#
# Client for live queries to JPL database lookup
#

import sys
import urllib
import re
from bs4 import BeautifulSoup
from datetime import datetime

class Asteroid:
  def __init__(self, name):
    self.name = name

  def load(self):
    r = JPL_Query(self.name)

    self.data = {}

    self.data['diameter_km'] = r.physicalParameter('diameter')
    self.data['gm'] = r.physicalParameter('GM')
    self.data['density'] = r.physicalParameter('bulk density')

    self.data['passage_jed'] = r.orbitalParameter('t')
    self.data['perhilion_au'] = r.orbitalParameter('q')
    self.data['semimajor_au'] = r.orbitalParameter('a')
    self.data['period_days'] = r.orbitalParameter('period')

    self.data['emoid_au'] = r.additionalInfoParameter('Earth MOID')

    self.data['close_approaches'] = r.closeApproaches()

    print self.data

class JPL_Query:
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

  def closeApproaches(self):
    tag = self.soup.find(text='Nominal Distance (AU)')
    if not tag:
      return None
    tag = tag.find_parent('tr')
    if not tag:
      return None

    tag = tag.next_sibling.next_sibling
    results = []
    while tag:
      texts = map(lambda x: x.get_text(), tag.find_all('font'))
      d = {}
      d['date'] = datetime.strptime(texts[0], '%Y-%b-%d %H:%M')
      d['uncertainty'] = texts[1]
      d['body'] = texts[2]
      d['nom_dist_au'] = texts[3]
      d['min_dist_au'] = texts[4]
      d['max_dist_au'] = texts[5]
      d['v_relative'] = texts[6]
      d['v_infinity'] = texts[7]
      d['jd'] = texts[8]
      d['uncertainty2'] = texts[9]
      d['semi_major'] = texts[10]
      d['semi_minor'] = texts[11]
      d['range_lov'] = texts[12]
      d['n_sigma'] = texts[13]
      d['bp'] = texts[14]
      d['orbit_ref'] = texts[15]
      d['ref'] = texts[16]
      d['modified'] = texts[17]

      results.append(d)

      tag = tag.next_sibling
      if tag:
        tag = tag.next_sibling

    return results

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print 'usage: lookup <name>'
    sys.exit(1)
  a = Asteroid(' '.join(sys.argv[1:]))
  a.load()
