#
# The constants used in calculations for the values of asteroids.
#

# General constants
GENERAL_INDEX = {
  'cost_to_orbit': 22000000,  # $ / kg
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
    'nickel': 10,
    'cobalt': 10,
  },
  'poo': {
    'stainless steel': 50,

  }
}

# Keys are raw materials. Values are maps contain information on
# the value of these materials.
MATERIALS_INDEX = {
  'water': {
    '$_per_kg': 0.01
  },
  'hydrogen': {
    '$_per_kg': 0.01
  },
  'stainless steel': {
    '$_per_kg': 0.20
  },

}

def valuePerKg(type):
  mat_price_per_kg = 0
  for mat, pct in SPECTRA_INDEX[type].iteritems():
    mat_price_per_kg += MATERIALS_INDEX[mat]['$_per_kg'] * pct / 100
  return mat_price_per_kg

def savedPerKg(type):
  cto = GENERAL_INDEX['cost_to_orbit']
  ret = 0
  for mat,pct in SPECTRA_INDEX[type].iteritems():
    ret += cto * pct / 100
  return ret
