#
# Scoring function for asteroid objects
#
#from bigfloat import *   # TODO use this
import math
import estimate

DEFAULT_RADIUS = 5  # km
DEFAULT_MASS = 1.47e15  # kg
DEFAULT_MOID = 2  # TODO get avg moid

def closeness_weight(obj):
  emoid = DEFAULT_MOID if isinstance(obj['moid'], basestring) else obj['moid']
  #moid_score = pow(math.e, -0.5 * emoid)
  moid_score = 0
  #moid_score = pow(max(moid_score, 0), 2)

  # penalize aphelion distance
  aph = obj['ad']
  aph_score = pow(math.e, -0.9 * aph)

  major_axis = obj['a']
  ma_score = pow(math.e, -0.5 * major_axis)

  ph = obj['per']
  ph_score = pow(math.e, -0.5 * ph)

  # TODO probably get more technical about the orbit
  return pow(moid_score + aph_score + ma_score + ph_score + 1, 2)

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
  else:
    exactmass = True
    mass = obj['GM'] / G

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

  stype = obj['spec_B']
  return (estimate.valuePerKg(stype) * mass,
          estimate.savedPerKg(stype) * mass)
