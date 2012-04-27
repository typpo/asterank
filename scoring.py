#
# Scoring function for asteroid objects
#
import math

def closeness_weight(obj):
  s = (10-obj['moid']) * 3
  if obj['neo'] != 'N':
    s = s * 3
  if obj['pha'] != 'N':
    s = s * 1.4
  return s

def price(obj):
  G = 6.67300e-11
  gmass = obj['GM'] if isinstance(obj['GM'], basestring) else 1.47e21 * G
  radius = obj['diameter'] if 'diameter' in obj else 5  # 5km radius by default
  vol = 4/3 * math.pi * math.pow(radius, 3) # model as sphere
  density = gmass / vol

  return gmass

def score(obj):
  return closeness_weight(obj) * price(obj)
