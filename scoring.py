#
# Scoring function for asteroid objects
#
import math

def closeness_weight(obj):
  emoid = 1 if isinstance(obj['GM'], basestring) else obj['moid']
  s = (10-emoid) * 3
  """
  if obj['neo'] != 'N':
    s = s * 1.4
  if obj['pha'] != 'N':
    s = s * 1.2
    """
  s = s * ((1/obj['ad']) * 100)    # penalize aphelion distance
  return s

def price(obj):
  G = 6.67300e-11
  gmass = 1.47e21 * G if isinstance(obj['GM'], basestring) else obj['GM']
  radius = 5000 if obj['diameter'] == '' else obj['diameter']   # 5km radius by default
  vol = 4/3 * math.pi * math.pow(radius, 3) # model as sphere
  density = gmass / vol

  return density

def score(obj):
  return price(obj) + closeness_weight(obj)
