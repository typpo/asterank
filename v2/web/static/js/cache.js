function SimpleCache(hash_fn) {
  var me = this;
  var cache = {};
  me.Get = function(key) {
    var result = cache[hash_fn(key)];
    return result ? result : false;
  }
  me.Set = function(key, val) {
    cache[hash_fn(key)] = val;
  }
}
