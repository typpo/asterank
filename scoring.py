#
# Scoring function for asteroid objects
#
from bigfloat import *   # TODO use this
import math

DEFAULT_RADIUS = 5  # km
DEFAULT_MASS = 1.47e15  # kg

CLASSIFICATION_MULTIPLIERS = {
  # Estimated value per m^3
  'S:': 1,
  'Ld': 1,
  'V': 1,
  'K:': 1,
  'Cgh': 1,
  'C type': 1,
  'X:' : 1,
  'C:' : 1,
  'Q' : 1,
  'V:' : 1,
  'K' : 1,
  'A' : 1,
  'C' : 1,
  'B' : 1,
  'S(IV)': 1,
  'Sq:': 1,
  'Sr': 1,
  'Sq': 1,
  'L': 1,
  'O': 1,
  'Sk': 1,
  'S': 1,
  'R': 1,
  'U': 1,
  'T': 1,
  'Sl': 1,
  'X': 1,
  'Sa': 1,
  'Xk': 1,
  'Ch': 1,
  'Cb': 1,
  'Cg': 1,
  'Xe': 1,
  'Xc': 1,
}

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
  G = 6.67300e-20   # km^3 / kgs^2

  # mass in kg
  exactmass = False
  if isinstance(obj['GM'], basestring):
    mass = DEFAULT_MASS
  else:
    exactmass = True
    mass = obj['GM'] / G

  # radius in m
  if isinstance(obj['diameter'], basestring):
    if exactmass:
      # If we know the mass, don't make assumptions about radius
      print 'Disqualified', obj['full_name']
      return -1

    # 5km radius by default
    radius = DEFAULT_RADIUS
  else:
    if not exactmass:
      # If we know the radius, don't make assumptions about mass
      # a lot of things meet this test
      #print 'Disqualified', obj['full_name']
      radius = DEFAULT_RADIUS
    else:
      radius = obj['diameter'] / 2

  # vol in km^3
  vol = 4/3 * math.pi * math.pow(radius, 3) # model as sphere

  # density in kg/km^3
  #density = mass / vol

  return estimateValue(obj, vol)

def estimateValue(obj, vol):
  """
  vol: volume in km^3
  """

  vol = vol * 1e9   # volume in m^3
  m1 = CLASSIFICATION_MULTIPLIERS.get(obj['spec_B'], 1)
  m2 = CLASSIFICATION_MULTIPLIERS.get(obj['spec_T'], 1)
  if spec_B == 1 and spec_T == 1:
    print obj['full_name'], 'does not have mapped spectra type:', obj
    return -1

  # TODO do we want to prefer SMASS?
  return math.max(m1, m2)

def score(obj):
  #return price(obj) + closeness_weight(obj)
  return price(obj)
