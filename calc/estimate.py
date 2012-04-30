#
# The constants used in calculations for the values of asteroids.
#

# General constants
GENERAL_INDEX = {
  'cost_to_orbit': 2900,  # $ / kg
}

CLASSIFICATION_MULTIPLIERS = {
  # Estimated value per m^3
  'D': 5.06,
  'Ld': 1,
  'V': 1,
  'Cgh': 1,
  'C type': 1,
  'Q' : 1,
  'K' : 1,
  'A' : 1,
  'C' : 1,
  'B' : 1,
  'S(IV)': 1,
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

# Keys are asteroid spectra type. Values are maps from a material
# to the percent mass of each material.
SPECTRA_INDEX = {
  'A': {
  },
  'B': {
    'hydrogen': 0.235,
    'iron': 25,
  },
  'C': {
    'water': 0.000023,
  },
  'Ch': {
    'water': 0.000023,
  },
  'Cg': {
    'water': 0.000023,
  },
  'Cgh': {
    'water': 0.000023,
  },
  'C type': {
    'water': 0.000023,
  },
  'Cb': {   # transition object between C and B
    'water': 0.000011,
    'hydrogen': 0.1175,
    'iron': 12.5,
  },
  'D': {
    'water': 0.000023,
  },
  'K': {  # copied from S
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'L': {  # copied from S
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'Ld': {  # copied from S
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'M': {
    'iron': 88,
    'nickel': 10,
    'cobalt': 0.5,
  },
  'O': {
    'nickel-iron': 2.965,
  },
  'R': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'S': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  # Sa, Sq, Sr, Sk, and Sl all transition objects (assume half/half)
  'Sa': {
    'magnesium silicate': 5e-31,
    'iron silicate': 0,
  },
  'Sq': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'Sr': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'Sk': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'Sl': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'S(IV)': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'Q': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'R': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'T': {

  },
  'V': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'X': {  # TODO these vals only apply to M-type within X
    'iron': 88,
    'nickel': 10,
    'cobalt': 0.5,
  },
  'Xe': {  # TODO these vals only apply to M-type within X
    'iron': 88,
    'nickel': 10,
    'cobalt': 0.5,
  },
  'Xc': {  # TODO these vals only apply to M-type within X
    'iron': 88,
    'nickel': 10,
    'cobalt': 0.5,
  },
  'Xk': {  # TODO these vals only apply to M-type within X
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
  'nickel-iron': {  # I dunno, just average them
    '$_per_kg': 1.01e-5,
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
