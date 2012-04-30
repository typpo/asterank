#
# The constants used in calculations for the values of asteroids.
#

# General constants
GENERAL_INDEX = {
  'COST_TO_ORBIT': 22000000,  # $ / kg
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

},

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
