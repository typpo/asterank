import md5

def md5_storage_hash(s):
  m = md5.new()
  m.update(s)
  return m.hexdigest()

