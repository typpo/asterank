#!/usr/bin/env python
#
# Client for live queries to JPL database lookup
#

import sys
import urllib
import re
import json
from bs4 import BeautifulSoup
from datetime import datetime

class Asteroid:
  def __init__(self, name):
    self.name = name

  def load(self):
    r = JPL_Query(self.name)

    self.data = {}

    self.data['Diameter (km)'] = r.physicalParameter('diameter')
    self.data['GM (km^3/s^2)'] = r.physicalParameter('GM')
    self.data['Density (g/cm^3)'] = r.physicalParameter('bulk density')
    self.data['Extent (km)'] = r.physicalParameter('extent')
    self.data['Rotation (hrs)'] = r.physicalParameter('rotation period')
    self.data['Albedo'] = r.physicalParameter('geometric albedo')

    self.data['Inclination (deg)'] = r.orbitalParameter('i')
    self.data['Passage (JED)'] = r.orbitalParameter('t')
    self.data['Perhilion (AU)'] = r.orbitalParameter('q')
    self.data['Aphelion (AU)'] = r.orbitalParameter('Q')
    self.data['Semi-major Axis (AU)'] = r.orbitalParameter('a')
    self.data['Period (days)'] = r.orbitalParameter('period')

    self.data['EMOID (AU)'] = r.additionalInfoParameter('Earth MOID')

    self.data['Close Approaches'] = r.closeApproaches()

    #print self.data

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
      pydate = datetime.strptime(texts[0], '%Y-%b-%d %H:%M')
      if pydate >= datetime.today():
        d['date'] = texts[0]
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
  if len(sys.argv) < 2:
    print 'usage: lookup <name>'
    sys.exit(1)
  a = Asteroid(' '.join(sys.argv[1:]))
  a.load()
  print json.dumps(a.data)
