import md5
def md5_storage_hash(str):
  m = md5.new()
  m.update(str)
  return m.hexdigest()

