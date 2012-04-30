var express = require('express')
  , _ = require('underscore')
  , app = express.createServer()

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
    admin: opts.admin,
  });
});

var port = process.env.PORT || 8080;
app.listen(port);

console.log('Started listening on port 8080');
