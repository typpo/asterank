#!/usr/bin/env python

from jpl_lookup import Asteroid
import pymongo
from pymongo import Connection

#
# Crawl top looked at objects
#
TOP = """162385 (2000 BM19),1113
253 Mathilde,578
4034 Vishnu (1986 PA),318
241 Germania,276
(2009 WY7),193
65679 (1989 UQ),126
7753 (1988 XB),79
164 Eva,75
4341 Poseidon (1987 KF),69
5143 Heracles (1991 VL),68
3200 Phaethon (1983 TB),65
25330 (1999 KV4),45
84 Klio,43
(1997 RT),37
85990 (1999 JV6),33
90 Antiope,32
(2006 DM63),29
2 Pallas,29
8201 (1994 AH2),28
132 Aethra,26
3628 Boznemcova (1979 WD),23
202683 (2006 US216),19
(1994 GL),18
(1998 DK36),18
1 Ceres,16
(2002 AL31),14
152563 (1992 BF),13
(2000 CO101),11
704 Interamnia (1910 KU),10
10302 (1989 ML),8
162173 (1999 JU3),8
35396 (1997 XF11),8
175706 (1996 FG3),8
(2007 TD),7
(2007 EG),7
(2006 JF42),7
3671 Dionysus (1984 KD),7
(2001 YE4),7
2100 Ra-Shalom (1978 RA),6
(1998 SD9),6
"""

connection = Connection('localhost', 27017)
db = connection.asterank

asteroids = db.asteroids
jpl = db.jpl
for asteroid in asteroids.find().sort('price', pymongo.DESCENDING).limit(150):
  """
  parts = line.split(',')
  desig = parts[0]
  count = parts[1]
  """
  desig = asteroid['full_name']
  idx = desig.find('(')
  if idx > 0:
    desig = desig[idx:]
    idx = 0
  if idx == 0:
    desig = desig[1:-1]

  print 'q:', desig
  a = Asteroid(desig)
  a.load()

  jpl.insert(a.data)
