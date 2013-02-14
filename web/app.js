var express = require('express')
  , connect = require('connect')
  //, gzip = require('connect-gzip')
  //, app = express.createServer(gzip.gzip({ flags: '--best' }))
  // cloudflare does gzip for us now, and this was causing issues.
  , app = express.createServer()
  , _ = require('underscore')
  , BundleUp = require('bundle-up')
  , lookup = require('./lookup.js')
  , mailer = require('./mailer.js')

// Express config
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });

app.use(express.cookieParser());
//app.use(connect.compress());
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

var DEV_PORT = 19590;
var PROD_PORT = 9590;
var IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Minification
BundleUp(app, __dirname + '/assets', {
  staticRoot: __dirname + '/public/',
  staticUrlRoot: '/',
  bundle: IS_PRODUCTION,
  minifyCss: false,
  minifyJs: true,
});

// Routing

app.get('/', function(req, res) {
  // homepage with special args and top ranking data
  lookup.homepage(function(err, summary_result) {
    renderWithContext(res, 'index', {
      nosocial: req.query.nosocial !== undefined,
      summary: summary_result,
    });
  });
});

app.get('/about', function(req, res) {
  // about page
  renderWithContext(res, 'about');
});

app.get('/feedback', function(req, res) {
  // serve feedback form
  renderWithContext(res, 'feedback');
});

app.post('/feedback', function(req, res) {
  // process feedback form
  var email = req.body.email;
  var feedback = req.body.feedback;
  mailer.mail(email + ':\r\n' + feedback);
  res.redirect('/')
});

app.get('/3dtest', function(req, res) {
  renderWithContext(res, '3d');
});

app.get('/top', function(req, res) {
  // gets top n asteroids for a given sort system
  var num = parseInt(req.query.n);
  if (isNaN(num) || typeof num !== 'number')
    num = 100;
  //else
  // NOTE no minimum for many-particles simulation
    //num = Math.min(num, 10000);
  var include_3d_vars = req.query.use3d ? true : false;
  var compact = req.query.compact ? true : false;
  lookup.topN({
    n: num,
    sort: req.query.sort,
    include_3d_vars: include_3d_vars,
    compact: compact,
  },
    function(err, result) {
    if (err) {
      res.status(500);
      res.send({results:result});
    }
    else {
      res.send({results:result});
    }
  });
});

app.get('/summary', function(req, res) {
  // Homepage result summary
  lookup.homepage(function(err, result) {
    if (err) {
      res.status(500);
      res.send(result);
    }
    else {
      res.send(result);
    }
  });
});

app.get('/count', function(req, res) {
  // Number of 'roids in the db
  lookup.count(num, function(err, result) {
    res.send({n: result});
  });
});

app.get('/info/:query', function(req, res) {
  // Query info on a specific asteroid
  lookup.query(req.params.query, function(err, result) {
    res.send({data: result});
  });
});

app.get('/search/:q', function(req, res) {
  // Placeholder: search database for any asteroid
  res.send('');
});

app.get('/autocomplete/:query', function(req, res) {
  // Query info on a specific asteroid
  lookup.autoComplete(req.params.query, function(err, result) {
    res.send({data: result});
  }, {
    full_results: false,
    limit: 8,
  });
});

app.get('/api/:query', function(req, res) {
  // Query info on a specific asteroid
  lookup.autoComplete(req.params.query, function(err, result) {
    res.send({data: result});
  }, {
    full_results: true,
    limit: 100,
  });
});

app.post('/subscribe', function(req, res) {
  // Mail me to subscribe
  var email = req.body.email;
  mailer.mail('subscribe ' + email);
  res.redirect('/');
});

function renderWithContext(res, template, obj) {
  // Add a global context to all templates
  if (!obj) obj = {};
  obj.context = {
    layout: 'layout',
    production: IS_PRODUCTION,
  };
  res.render(template, obj);
}

// Start server
var port = process.env.PORT || (IS_PRODUCTION ? PROD_PORT : DEV_PORT);
app.listen(port);

console.log('Running in context:', process.env.NODE_ENV);
console.log('Started listening on port ' + port);
