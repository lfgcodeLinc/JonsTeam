var express = require('express');
var dust = require('dustjs-linkedin');
var cons = require('consolidate');
var pg = require('pg');

var user = require('./routes/user');
var port = process.env.PORT || 3000;

creds = {
  user: "vqesjlxdyoxqvq",
  password: "HR5OD_Svzd48Nwzu6FN4-VTZd6",
  database: "dabosh8r2vtap1",
  port: 5432,
  host: "ec2-54-243-245-159.compute-1.amazonaws.com",
  ssl: true
};
pgConnString = process.envHEROKU_POSTGRESQL_TEAL_URL;

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
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;

  next();

  delete req.session.success;
  delete req.session.error;
});
app.use(app.router);

app.get('/', function (req, res) {
  res.render('index.dust');
});

app.get('/inventory', function (req, res) {
    /*
       select * from inventory join items on inventory.item_id = items.id;
       */
});
app.get('/donate', function (req, res) {
});
app.post('/volunteer', function (req, res) {
  // insert into volunteers (user_id, availability) values (?, ?);
});
app.post('/login', user.login);
app.get('/logout', user.logout);
app.post('/register', user.create);
app.get('/register', user.register);

var server = app.listen(port, function () {
  var host = server.address().address;
  console.log('Example app listening at http://%s:%s', host, port);
});
