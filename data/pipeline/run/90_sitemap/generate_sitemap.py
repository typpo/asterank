#!/usr/bin/env python

import pymongo
from pymongo import Connection

SITEMAP = """
<?xml version="1.0" encoding="UTF-8"?>
<urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
<url>
  <loc>http://www.asterank.com/</loc>
  <priority>1.00</priority>
</url>
<url>
  <loc>http://www.asterank.com/about</loc>
  <priority>0.80</priority>
</url>
<url>
  <loc>http://www.asterank.com/3d</loc>
  <priority>0.95</priority>
</url>
<url>
  <loc>http://www.asterank.com/discover</loc>
  <priority>0.80</priority>
</url>
<url>
  <loc>http://www.asterank.com/exoplanets</loc>
  <priority>0.80</priority>
</url>
<url>
  <loc>http://www.asterank.com/galaxies/</loc>
  <priority>0.80</priority>
</url>
<url>
  <loc>http://www.asterank.com/api</loc>
  <priority>0.80</priority>
</url>
<url>
  <loc>http://www.asterank.com/mpc</loc>
  <priority>0.80</priority>
</url>
<url>
  <loc>http://www.asterank.com/kepler</loc>
  <priority>0.80</priority>
</url>
<url>
  <loc>http://www.asterank.com/skymorph</loc>
  <priority>0.80</priority>
</url>
%s
</urlset>
"""

URL_TAG_TEMPLATE = """
<url>
  <loc>%s</loc>
  <priority>0.50</priority>
</url>
"""

URL_TEMPLATE = 'http://www.asterank.com/asteroid-%s'

connection = Connection('localhost', 27017)
jpl = connection.asterank.jpl
asteroids = connection.asterank.asteroids

url_tags = []
for asteroid in jpl.find():
  slug = asteroid['tag_name'].lower().replace(' ', '-')
  url = URL_TEMPLATE % slug
  url_tags.append(URL_TAG_TEMPLATE % url)

print SITEMAP % (''.join(url_tags))
