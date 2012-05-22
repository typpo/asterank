#
# The constants used in calculations for the values of asteroids.
#

# General constants
GENERAL_INDEX = {
  'cost_to_orbit': 2200,  # $ / kg
}

# Keys are asteroid spectra type. Values are maps from a material
# to the percent mass of each material.
SPECTRA_INDEX = {
  'A': {
  },
  'B': {
    'hydrogen': 0.235,
    'nitrogen': 0.001,
    'ammonia': 0.001,
    'iron': 10,
  },
  'C': {
    'water': 1.55495461,
    #'nickel-iron': 0.0869229283,
    'platinum': 0.01,

    # lewis estimates
    'iron': 62.196,
    'nickel': 1.26,
    'cobalt': 0.18,
  },
  'Ch': {
    'water': 1.55495461,
    #'nickel-iron': 0.0869229283,
    'platinum': 0.01,
    # lewis estimates
    'iron': 62.196,
    'nickel': 1.26,
    'cobalt': 0.18,
  },
  'Cg': {
    'water': 1.55495461,
    #'nickel-iron': 0.0869229283,
    'platinum': 0.01,
    # lewis estimates
    'iron': 62.196,
    'nickel': 1.26,
    'cobalt': 0.18,
  },
  'Cgh': {
    'water': 1.55495461,
    #'nickel-iron': 0.0869229283,
    'platinum': 0.01,
    # lewis estimates
    'iron': 62.196,
    'nickel': 1.26,
    'cobalt': 0.18,
  },
  'C type': {
    'water': 1.55495461,
    #'nickel-iron': 0.0869229283,
    'platinum': 0.01,
    # lewis estimates
    'iron': 62.196,
    'nickel': 1.26,
    'cobalt': 0.18,
  },
  'Cb': {   # transition object between C and B
    'hydrogen': 0.1175,
    #'iron': 12.5,
    'water': 0.775,
    #'nickel-iron': 0.0434,
    'platinum': 0.005,

    # lewis estimates
    'iron': 36,
    'nickel': 0.63,
    'cobalt': 0.09,
  },
  'D': {
    'water': 0.000023,
  },
  'E': {

  },
  'K': {  # cross between S and C
    'water': 0.775,
    'nickel-iron': 0.0434,
    'platinum': 0.005,
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
    'platinum': 1.25,
  },
  'P': {  # correspond to CI, CM carbonaceous chondrites
    'water': 12.5,
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
    'nickel-iron': 13.315,
  },
  'R': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },
  'T': {
    'iron': 6,
  },
  'U': {

  },
  'V': {
    'magnesium silicate': 1e-30,
    'iron silicate': 0,
  },

  # TODO use density to decide on what kind of X?
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
    'platinum': 0.005,
  },
  'Xk': {  # TODO these vals only apply to M-type within X
    'iron': 88,
    'nickel': 10,
    'cobalt': 0.5,
  },
}


# Keys are raw materials. Values are maps containing information on
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
    '$_per_kg': 0.01,
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
    '$_per_kg': 0.20,
  },
  'stainless steel': {
    '$_per_kg': 0.20
  },
  'platinum': {
    '$_per_kg': 1
  },
  'magnesium silicate': {
    '$_per_kg': 1e-25,
  },
  'iron silicate': {
    '$_per_kg': 0,
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
  return ret - (cto / 3)  # assume it costs 1/3 as much to mine and get off the asteroid

def profitRatio(dv):
  # Baseline profit is 10%
  return .65 / dv
