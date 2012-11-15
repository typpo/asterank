var Mongolian = require('mongolian')
  , _ = require('underscore')
  , sys = require('sys')
  , path = require('path')
  , exec = require('child_process').exec
  , shared_util = require('./shared_util.js')

/**
* Accepted sort fields for top N rankings
*/
var VALID_SORT_FIELDS = {
  score: -1,
  price: -1,
  saved: -1,
  closeness: -1,
  profit: -1,
}

var HOMEPAGE_CACHE_ENABLED = true;

var topN_query_cache = {};

var homepage_summary_result;  // cache of summary results

/**
 * Grabs the 'top rankings' data for display on the homepage.
 * Lazily cache.
 *
 * @param {function} callback passed err, results
 */
function homepage(cb) {
  if (HOMEPAGE_CACHE_ENABLED && homepage_summary_result) {
    // poor man's cache
    cb(false, homepage_summary_result);
    return;
  }

  console.log('Pulling homepage data...');
  var mv,mce,up;
  var trigger = _.after(3, function() {
    homepage_summary_result = {
      most_valuable: mv,
      most_cost_effective: mce,
      upcoming_passes: up,
    };
    cb(false, homepage_summary_result);
  });

  // most valuable
  topN({n: 4, sort: 'price'}, function(err, result) {
    mv = result.rankings;
    trigger();
  });
  // most cost effective
  topN({n: 4, sort: 'score'}, function(err, result) {
    mce = result.rankings;
    trigger();
  });
  // upcoming passes
  upcomingPasses(4, function(err, result) {
    up = result;
    trigger();
  });
}

/**
 * Returns upcoming passes
 *
 * @param {number} number of results to return
 * @param {function} callback
 */
function upcomingPasses(num, cb) {
  var db = new Mongolian('localhost/asterank');
  var coll = db.collection('jpl');
  coll.find({'Next Pass': {$exists: true, $ne: null},
            'Next Pass.date_iso': {$gte: new Date().toISOString()}})
    .sort({'Next Pass.date_iso': 1})
    .limit(num).toArray(function(err, docs) {
      if (docs) {
        for (var i in docs) {
          delete docs[i]._id;
          // Need to pair prices with each jpl entry

        }
      }

      cb(err, docs);
  });
}

/**
 * Generates a unique key for a given topN query.
 *
 * @param {object} parameters for search
 * @return {string} key
 */
function queryToKey(opts) {
  return opts.sort + '_' + opts.n + '_' + opts.include_3d_vars;
}

/**
 * Returns the top results based on given ranking parameters.
 *
 * @param {object} parameters for search.
 *  Valid parameters: sort, n, include_3d_vars
 * @param {function} callback
 */
function topN(opts, cb) {
  opts = opts || {};
  opts.sort = opts.sort || 'score';
  opts.n = opts.n || 10;
  opts.include_3d_vars = opts.include_3d_vars || false;

  if (!VALID_SORT_FIELDS[opts.sort]) {
    cb(true, null);
    return;
  }
  var db = new Mongolian('localhost/asterank');
  var coll = db.collection('asteroids');
  var sortobj = {};
  sortobj[opts.sort] = VALID_SORT_FIELDS[opts.sort];
  console.log('limit', opts.n);

  var query_key = queryToKey(opts);
  if (topN_query_cache[query_key]) {
    // present in cache
    console.log('returning query from cache');
    cb(null, topN_query_cache[query_key]);
    return;
  }

  coll.find().limit(opts.n).sort(sortobj).toArray(function(err, docs) {
    if (err) {
      cb(true, null);
      return;
    }

    // load asteroid rankings
    var rankings = _.map(docs, function(doc) {
      var args = [doc, 'score', 'saved', 'price', 'profit',
        'closeness', 'GM', 'spec_B', 'full_name',
        'moid', 'neo', 'pha', 'diameter', 'inexact', 'dv', 'a', 'e', 'q',
        'prov_des', 'w', ];
      //if (opts.include_3d_vars) {
      // Always include, now
        args.push.apply(args, ['i', 'om', 'ma', 'n', 'epoch','tp', 'per']);
      //}
      var ret = _.pick.apply(this, args);
      ret.fuzzed_price = shared_util.toFuzz(ret.price);
      return ret;
    });

    // load composition map
    var cmd = path.join(__dirname, '../calc/horizon.py') + ' compositions';
    var child = exec(cmd, function (error, stdout, stderr) {
      var compositions = null;
      if (error)
        console.error(error);
      else
        compositions = JSON.parse(stdout);

      // cache result
      var full_result = {
        rankings: rankings,
        compositions: compositions,
      };
      topN_query_cache[query_key] = full_result;

      // send result to client
      cb(null, full_result);
    });
  });
}

/**
 * Total number of asteroids
 *
 * @param {function} callback
 */
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

/**
 * JPL query.  Checks the JPL cache and scrapes JPL if necessary.
 *
 * @param {string} query to search for
 * @param {function} callback
 */
function query(query, cb) {
  // Validate - this stuff will be exec'ed. This is probably a bad idea.
  // TODO Should switch to using spawn.
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
  homepage: homepage,
}
