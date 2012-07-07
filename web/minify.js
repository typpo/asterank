var fs = require('fs')
    , path = require('path')
    , _ = require('underscore')

function walk(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

function minify(cb) {
  walk(path.join(__dirname, 'public/js'), function(err, files) {
    var all_src = '';
    var minify = _.filter(files, function(f) {
      return (f.indexOf('.js') == f.length - 3 && f != 'bundle.js');
    }).map(function(f) {
      console.log(f);
      return f;
    });
    var exec = require('child_process').exec;

    var closurelib = path.join(__dirname, '../lib/compiler.jar');
    var targets = minify.join(' ');
    var bundlepath = path.join(__dirname, '/public/js/bundle.js');
    var cmd = 'java -jar '
      + closurelib
      + ' --compilation_level SIMPLE_OPTIMIZATIONS --warning_level QUIET'
      + ' ' + targets + ' > ' + bundlepath;
    exec(cmd, function(err, stdout, stderr) {
      if (err) {
        console.log(stderr);
        process.exit();
      }
    });

    console.log('writing new minified js bundle..');
    fs.writeFileSync(path.join(__dirname, 'public/js/bundle.js'), all_src);
  });
}

module.exports = {
  minify: minify,
}
