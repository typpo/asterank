
def closeness_weight(obj):
  s = (10-obj['moid']) * 3
  if obj['neo'] != 'N':
    s = s * 3
  if obj['pha'] != 'N':
    s = s * 1.4
  return s

def price(obj):
  # TODO
  return 1

def score(obj):
  return closeness_weight(obj) * price(obj)
