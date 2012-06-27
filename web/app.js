var express = require('express')
  , app = express.createServer()
  , _ = require('underscore')
  , lookup = require('./lookup.js')
  , mailer = require('./mailer.js')

// Express config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.cookieParser());
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

var DEFAULT_PORT = 19590;

// App

app.get('/', function(req, res) {
  renderWithContext(res, 'index', {
    nosocial: req.query.nosocial !== undefined,
  });
});

app.get('/about', function(req, res) {
  renderWithContext(res, 'about');
});

app.get('/feedback', function(req, res) {
  renderWithContext(res, 'feedback');
});

app.post('/feedback', function(req, res) {
  var email = req.body.email;
  var feedback = req.body.feedback;
  mailer.mail(email + ':\r\n' + feedback);
  res.redirect('/')
});

app.get('/top', function(req, res) {
  var num = parseInt(req.query.n);
  if (isNaN(num) || typeof num !== 'number')
    num = 100;
  else
    num = Math.min(num, 10000);
  lookup.topN(num, req.query.sort, function(err, result) {
    res.send({results:result});
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

app.post('/subscribe', function(req, res) {
  var email = req.body.email;
  mailer.mail('subscribe ' + email);
  res.redirect('/');
});

function renderWithContext(res, template, obj) {
  if (!obj) obj = {};
  obj.context = {
    production: process.env.NODE_ENV === 'production',
  };
  res.render(template, obj);
}

var port = process.env.PORT || DEFAULT_PORT;
app.listen(port);

console.log('Running in context:', process.env.NODE_ENV);
console.log('Started listening on port ' + port);
