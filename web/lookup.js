var Mongolian = require('mongolian')
  , _ = require('underscore')
  , sys = require('sys')
  , path = require('path')
  , exec = require('child_process').exec;

var VALID_SORT_FIELDS = {
  score: -1,
  price: -1,
  saved: -1,
  closeness: -1,
}

function topN(num, sort, cb) {
  sort = sort || 'score';
  if (!VALID_SORT_FIELDS[sort]) {
    cb(true, null);
    return;
  }
  var db = new Mongolian('localhost/asterank');
  var coll = db.collection('asteroids');
  var sortobj = {};
  sortobj[sort] = VALID_SORT_FIELDS[sort];
  coll.find().limit(num).sort(sortobj).toArray(function(err, docs) {
    if (err) {
      cb(true, null);
      return;
    }
    var result = _.map(docs, function(doc) {
      return _.pick(doc, 'score', 'saved', 'price', 'closeness', 'GM',
        'spec_B', 'full_name',
        'moid', 'neo', 'pha', 'diameter', 'inexact', 'dv', 'a', 'q',
        'prov_des');
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
  if (!/^[A-Za-z0-9 ]+$/.test(query)) {
    cb(true, null);
    return;
  }
  query = query.trim();

  // Query JPL database for full information, but check the cache first.
  var db = new Mongolian('localhost/asterank');
  var coll = db.collection('jpl');
  coll.findOne({tag_name: query}, function(err, doc) {
    if (err || !doc) {
      var cmd = path.join(__dirname, '../calc/jpl_lookup.py') + ' ' + query;
      console.log('Looking up @ JPL:', query, ':', cmd);
      var child = exec(cmd, function (error, stdout, stderr) {
        if (error) {
          console.error(error);
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
      console.log('From JPL cache:', query);;
      delete doc._id;
      delete doc.tag_name;
      cb(null, doc);
    }
  });

}

module.exports = {
  topN: topN,
  count: count,
  query: query,

}
