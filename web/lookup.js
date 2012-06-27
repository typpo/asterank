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
  profit: -1,
}

function homepageContext(cb) {
  var mv,mce,up;
  var trigger = _.after(3, function() {
    cb({
      most_valuable: mv,
      most_cost_effective: mce,
      upcoming_passes: up,
    });
  });

  // most valuable
  topN(4, 'price', function(err, result) {
    mv = result;
    trigger();
  });
  // most cost effective
  topN(4, 'score', function(err, result) {
    mce = result;
    trigger();
  });
  // upcoming passes

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

    // load asteroid rankings
    var rankings = _.map(docs, function(doc) {
      return _.pick(doc, 'score', 'saved', 'price', 'profit',
        'closeness', 'GM', 'spec_B', 'full_name',
        'moid', 'neo', 'pha', 'diameter', 'inexact', 'dv', 'a', 'e', 'q',
        'prov_des');
    });

    // load composition map
    var cmd = path.join(__dirname, '../calc/horizon.py') + ' compositions';
    var child = exec(cmd, function (error, stdout, stderr) {
      var compositions = null;
      if (error)
        console.error(error);
      else
        compositions = JSON.parse(stdout);

      // send result to client
      cb(null, {
        rankings: rankings,
        compositions: compositions,
      });
    });
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
          console.log('start',stdout,'end');
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
