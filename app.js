var express = require('express');
var app = express();
var user = require('./routes/user');
var port = process.env.PORT || 3000;

pgConnString = process.envHEROKU_POSTGRESQL_TEAL_URL;

app.use(express.static('public'));
app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;

  next();

  delete req.session.success;
  delete req.session.error;
});

app.get('/', function (req, res) {
  res.send('Hello World!');
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

var server = app.listen(port, function () {
  var host = server.address().address;
  console.log('Example app listening at http://%s:%s', host, port);
});
