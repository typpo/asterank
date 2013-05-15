#
# Scoring function for asteroid objects
#
#from bigfloat import *   # TODO use this
import math
import random
import estimate

DEFAULT_RADIUS = 5  # km
DEFAULT_MASS = 1.47e15  # kg
DEFAULT_MOID = 2  # TODO get avg moid
DEFAULT_DV = 6.5 #km/s
DEFAULT_COMET_DV = 50  # km/s

def closeness_weight(obj):
  if obj['spec'] == 'comet':
    return -1

  emoid = DEFAULT_MOID if isinstance(obj['moid'], basestring) else obj['moid']

  # penalize aphelion distance
  aph = obj['ad']
  if aph > 50:
    return -1
  aph_score = 1/(1+math.exp(0.9*aph))

  major_axis = obj['a']
  ma_score = 1/(1+math.exp(0.45*major_axis))

  ph = obj['q']
  ph_score = 1/(1+math.exp(0.9*ph))

  if 'dv' in obj:
    dv = obj['dv']
  else:
    if obj['spec'] == 'comet':
      dv = DEFAULT_COMET_DV
    else:
      dv = DEFAULT_DV
  #dv_score = pow(math.e, -0.9 * dv)
  dv_score = 1 + (1/(1+math.exp(0.9*dv-4)))
  dv_score *= 2

  return pow(aph_score + ma_score + ph_score + dv_score + 1, 2) / (emoid+1)

def price(obj):
  """
  Returns a tuple of $ by two metrics:
    0. Asteroid value per kg in raw materials.
    1. Asteroid $ saved per kg versus sending it up from Earth.
  """
  G = 6.67300e-20   # km^3 / kgs^2

  # mass in kg
  exactmass = False
  if isinstance(obj['GM'], basestring):
    mass = DEFAULT_MASS
    obj['inexact'] = True
    mass = mass + (random.random() - .5) * 1e14   # some random factor
  else:
    exactmass = True
    mass = obj['GM'] / G

    if mass > 1e18:
      # if it's huge, penalize it because the surface will be covered in ejecta, etc.
      # and the goodies will be far beneath
      mass = mass * 1e-4


  """
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
  # TODO switch to ellipsoid vol
  vol = 4/3 * math.pi * math.pow(radius, 3) # model as sphere

  # density in kg/km^3
  #density = mass / vol
  """

  stype = obj['spec']
  value = estimate.valuePerKg(stype) * mass
  saved = estimate.savedPerKg(stype) * mass
  return (value, saved)

def profit(obj):
  my_dv = obj['dv'] if 'dv' in obj else DEFAULT_DV
  return obj['price'] * obj['closeness'] / 6 * estimate.profitRatio(DEFAULT_DV, my_dv)
