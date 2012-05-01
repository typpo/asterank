var express = require('express')
  , app = express.createServer()
  , _ = require('underscore')
  , Mongolian = require('mongolian')

// Express config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.cookieParser());
app.use(express.favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());


// App

app.get('/', function(req, res) {
  res.render('index', {

  });
});

app.get('/top', function(req, res) {
  var num = parseInt(req.query['n']);
  if (isNaN(num) || typeof num !== 'number') num = 100;

  var server = new Mongolian;
  var db = server.db('asterank');
  var coll = db.collection('asteroids');
  coll.find().limit(num).sort({score:-1}).toArray(function(err, docs) {
    if (err) {
      res.send({err:true});
      return;
    }
    var result = _.map(docs, function(doc) {
      return _.pick(doc, 'score', 'saved', 'price', 'closeness', 'GM', 'spec_B', 'full_name',
                      'moid', 'neo', 'pha', 'diameter');
    });
    res.send({aaData:result});
  });
});

app.get('/count', function(req, res) {
  var server = new Mongolian;
  var db = server.db('asterank');
  var coll = db.collection('asteroids');
  coll.count(function(err, count) {
    if (err) {
      res.send({n:500000});
      return;
    }
    res.send({n:count});
  });
});

app.get('/search/:q', function(req, res) {
  res.send('');
});

var port = process.env.PORT || 8080;
app.listen(port);

console.log('Started listening on port 8080');
