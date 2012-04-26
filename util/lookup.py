#!/usr/bin/env python
import sys
import urllib
from bs4 import BeautifulSoup


def lookup(query):
  src = urllib.urlopen('http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=%s' % query ).read()
  soup = BeautifulSoup(src.replace('cellspacing="0"0', ''))

  diameter_km = physicalParameter(soup, 'diameter')
  gm = physicalParameter(soup, 'GM')
  density = physicalParameter(soup, 'bulk density')

  passage_jed = orbitalParameter(soup, 't', True)
  perhilion_au = orbitalParameter(soup, 'q')
  semimajor_au = orbitalParameter(soup, 'a')
  period_days = orbitalParameter(soup, 'period')

def orbitalParameter(soup, txt, subscript=False):
  tag = soup.find(text=txt)
  if tag :
    if subscript:
      el = tag.find_parent('td').next_sibling.next_sibling.find('font').next
    else:
      el = tag.find_parent('td').next_sibling.next_sibling.find('font').next
    return float(el)
  return -1

def physicalParameter(soup, txt, subscript=False):
  tag = soup.find(text=txt)
  if tag:
    el = tag.find_parent('td').next_sibling.next_sibling.next_sibling.next_sibling.find('font').next
    return float(el)
  return -1

if __name__ == "__main__":
  if len(sys.argv) != 2:
    print 'usage: lookup <name>'
    sys.exit(1)
  lookup(' '.join(sys.argv[1:]))
