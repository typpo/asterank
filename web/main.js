var express = require('express')
  , app = express.createServer()
  , _ = require('underscore')
  , mutil = require('./mongo.js')

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

  mutil.getCollection('asteroids', function(err, coll) {
    if (err) {
      res.send({err:true});
      return;
    }
    coll.find().sort({score:-1}).limit(num).toArray(function(err, results) {
      if (err) {
        res.send({err:true});
        return;
      }
      res.send({aaData:results});
    });
  });
});

app.get('/tot', function(req, res) {
  mutil.getCollection('asteroids', function(err, coll) {
    if (err) {
      res.send({n:500000});
      return;
    }
    coll.count(function(err, count) {
      if (err) {
        res.send({n:500000});
        return;
      }
      res.send({n:count});
    });
  });
});

app.get('/search/:q', function(req, res) {
  res.send('');
});

var port = process.env.PORT || 8080;
app.listen(port);

console.log('Started listening on port 8080');
