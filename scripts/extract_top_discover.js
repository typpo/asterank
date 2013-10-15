var conn = new Mongo();
var db = conn.getDB('asterank');

var ret = db.stackblink_results.group({
  key: {'group_key': 1},
  initial: {count: 0},
  reduce: function(cur, result) {
    result.count += 1;
  }
});

printjson(ret);
