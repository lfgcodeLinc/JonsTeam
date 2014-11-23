var express = require('express');
var dust = require('dustjs-linkedin');
var cons = require('consolidate');
var pg = require('pg');

var user = require('./routes/user');
var volunteers = require('./routes/volunteers');
var wishlists = require('./routes/wishlists');
var inventory = require('./routes/inventory');
var orders = require('./routes/orders');
var port = process.env.PORT || 3000;
var host = process.env.HOST || 'localhost';

creds = {
  user: "vqesjlxdyoxqvq",
  password: "HR5OD_Svzd48Nwzu6FN4-VTZd6",
  database: "dabosh8r2vtap1",
  port: 5432,
  host: "ec2-54-243-245-159.compute-1.amazonaws.com",
  ssl: true
};
pgConnString = process.env.HEROKU_POSTGRESQL_TEAL_URL;

var app = express();
app.engine('dust', cons.dust);
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'dustjs-linkedin');
app.use(express.compress());
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.static('public'));
app.use(express.session({secret: 'fhsdlafdsjflkadsjlkfjlk'}));
app.use(function (req, res, next) {
  res.locals.user = req.session.email;
  res.locals.teacher = req.session.teacher;
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  res.locals.balance = req.session.balance;

  next();

  delete req.session.success;
  delete req.session.error;
});
app.use(app.router);

app.get('/', function (req, res) {
  res.render('index.dust');
});
app.get('/volunteer', function (req, res) {
  res.render('volunteer.dust');
});
app.get('/volunteers', volunteers.index);
app.get('/volunteer/:id', volunteers.get);
app.post('/volunteer', volunteers.create);
app.delete('/volunteer/:id', volunteers.delete);

app.get('/inventory', inventory.index);
app.post('/checkout', inventory.checkout);

app.get('/orders', orders.index);
app.get('/orders/:id', orders.get);
app.post('/orders/:id', orders.create);

app.post('/login', user.login);
app.get('/logout', user.logout);
app.post('/register', user.create);
app.get('/register', user.register);

app.get('/wishlists', wishlists.index);
app.get('/wishlist', wishlists.get);
app.post('/wishlist', wishlists.create);

var server = app.listen(port, function () {
  console.log('Example app listening at http://%s:%s', host, port);
});
