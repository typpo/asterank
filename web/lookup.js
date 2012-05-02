var Mongolian = require('mongolian')
  , _ = require('underscore')
  , sys = require('sys')
  , path = require('path')
  , exec = require('child_process').exec;

function topN(num, cb) {
  var db = new Mongolian('localhost/asterank');
  var coll = db.collection('asteroids');
  coll.find().limit(num).sort({score:-1}).toArray(function(err, docs) {
    if (err) {
      cb(true, null);
      return;
    }
    var result = _.map(docs, function(doc) {
      return _.pick(doc, 'score', 'saved', 'price', 'closeness', 'GM', 'spec_B', 'full_name',
                      'moid', 'neo', 'pha', 'diameter', 'inexact');
    });
    cb(null, result);
  });
}

function count(cb) {
  var db = new Mongolian('localhost/asterank');
  var coll = db.collection('asteroids');
  coll.count(function(err, count) {
    if (err) {
      cb(true, null);
      return;
    }
    cb(null, count);
  });
}

function query(query, cb) {
  // Validate - this stuff will be exec'ed. Should switch to spawn.
  if (!/^[a-z0-9 ]+$/.test(query)) {
    cb(true, null);
    return;
  }
  query = query.trim();

  // Query JPL database for full information, but check the cache first.
  var db = new Mongolian('localhost/asterank');
  var coll = db.collection('jpl');
  coll.findOne({tag_name: query}, function(err, doc) {
    if (err || !doc) {
      var child = exec(path.join(__dirname, '../calc/jpl_lookup.py') + ' ' + query,
                   function (error, stdout, stderr) {
        if (error) {
          cb(true, null);
        }
        else {
          var result = JSON.parse(stdout);
          cb(null, result);
          // record it in cache
          result.tag_name = query;
          coll.insert(result);
        }
      });
    }
    else {
      delete doc._id;
      cb(null, doc);
    }
  });

}

module.exports = {
  topN: topN,
  count: count,
  query: query,

}
