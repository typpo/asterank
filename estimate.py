#
# The constants used in calculations for the values of asteroids.
#

# General constants
GENERAL_INDEX = {
  'cost_to_orbit': 2900,  # $ / kg
}

# Keys are asteroid spectra type. Values are maps from a material
# to the percent mass of each material.
SPECTRA_INDEX = {
  'B': {
    'hydrogen': 0.235,
  },
  'D': {
    'water': 0.000023,
  },
  'M': {
    'iron': 88,
    'nickel': 10,
    'cobalt': 0.5,
  },
  'X': {  # TODO these vals only apply to M-type within X
    'iron': 88,
    'nickel': 10,
    'cobalt': 0.5,
  },
}

# Keys are raw materials. Values are maps contain information on
# the value of these materials.
MATERIALS_INDEX = {
  'water': {
    '$_per_kg': 0.01
  },
  'hydrogen': {
    '$_per_kg': 3.65808137,
  },
  'nitrogen': {
    '$_per_kg': 0.074094,
  },
  'ammonia': {
    '$_per_kg': 0,
  },
  'oxygen': {
    '$_per_kg': 0.21,
  },
  'iron': {
    '$_per_kg': 2e-7,
  },
  'nickel': {
    '$_per_kg': 0.00002,
  },
  'cobalt': {
    '$_per_kg': 0,
  },
  'stainless steel': {
    '$_per_kg': 0.20
  },

}

def valuePerKg(type):
  try:
    mat_price_per_kg = 0
    for mat, pct in SPECTRA_INDEX[type].iteritems():
      mat_price_per_kg += MATERIALS_INDEX[mat]['$_per_kg'] * pct / 100
    return mat_price_per_kg
  except:
    return -1

def savedPerKg(type):
  cto = GENERAL_INDEX['cost_to_orbit']
  ret = 0
  for mat,pct in SPECTRA_INDEX[type].iteritems():
    ret += cto * pct / 100
  return ret
