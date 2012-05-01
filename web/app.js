var express = require('express')
  , app = express.createServer()
  , _ = require('underscore')
  , lookup = require('./lookup.js')

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
  lookup.topN(num, function(err, result) {
    res.send({aaData:result});
  });

});

app.get('/count', function(req, res) {
  lookup.count(num, function(err, result) {
    res.send({n: result});
  });
});

app.get('/info/:query', function(req, res) {
  lookup.query(req.params.query, function(err, result) {
    res.send({data: result});
  });
});

app.get('/search/:q', function(req, res) {
  res.send('');
});

var port = process.env.PORT || 8080;
app.listen(port);

console.log('Started listening on port 8080');
