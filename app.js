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

  console.log(req.session);

  next();

  delete req.session.success;
  delete req.session.error;
});
app.use(app.router);

app.get('/', function (req, res) {
  res.render('index.dust');
});

app.get('/inventory', function (req, res) {
  res.locals.inventory = true;

  getInventory(function (err, items) {
    res.render('inventory.dust', {
      items: items
    });
  });
});

app.post('/checkout', function (req, res) {
  console.log(req.body);
  checkItems(req.body.items, req.session.userid, function (err, id) {
    if (err) return console.log(err);
    res.json({id: id});
  });
});
app.get('/orders', function (req, res) {
  res.locals.orders = true;
  getOrders(req.session.userid, function (err, orders) {
    res.render('orders.dust', {
      orders: orders
    });
  });
});
app.get('/orders/:id', function (req, res) {
  res.locals.orders = true;
  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      return;
    }

    var query = "SELECT orders.id, orders.created, orders.delivery_id, orders.completed, deliveries.location, to_char(pickup, 'YYYY-MM-DD') AS pickup FROM orders LEFT JOIN deliveries ON orders.delivery_id = deliveries.id WHERE orders.id = $1";
    client.query(query, [req.params.id], function (err, result) {
      if (err) return console.log(err);
      var order = result.rows[0];
      if (order.pickup === true) {
        order.pickup = false;
      }

      var query = "SELECT order_items.quantity, items.name, items.description, items.price FROM order_items JOIN items ON order_items.item_id = items.id WHERE order_items.order_id = $1";
      client.query(query, [req.params.id], function (err, result) {
        if (err) return console.log(err);
        client.end();
        var rows = result.rows.map(function (row) {
          row.total = row.price * row.quantity;
          return row;
        });
        order.items = rows;
        order.totalprice = rows.reduce(function (a, b) {
          return a + b.total;
        }, 0);
        res.render('order.dust', order);
      });
    });
  });
});
app.post('/orders/:id', function (req, res) {
  res.locals.orders = true;
  var id = req.params.id;
  var delivered = req.body.delivery;
  var deliverytext = req.body.deliverytexct;
  var delivery_id = (delivered) ? req.body.delivery_id : null;
  var pickup = req.body.pickup;
  var pickuptime = null;
  var completed = req.body.completed || false;

  var done = function (err) {
    var query = "SELECT orders.id, orders.created, orders.delivery_id, orders.completed, deliveries.location, to_char(pickup, 'YYYY-MM-DD') AS pickup FROM orders LEFT JOIN deliveries ON orders.delivery_id = deliveries.id WHERE orders.id = $1";
    client = new pg.Client(creds);
    client.connect();
    client.query(query, [req.params.id], function (err, result) {
      client.end();
      var order = result.rows[0];
      if (order.pickup === true) {
        order.pickup = false;
      }
      res.render('order.dust', order);
    });
  };

  if (pickup) {
    pickuptime = req.body.pickuptime;
  }

  var query = "UPDATE orders SET pickup = $1, delivery_id = $2, completed = $3 WHERE id = $4";
  client = new pg.Client(creds);
  client.connect();
  client.query(query, [pickuptime, delivery_id, completed, id], function (err, result) {
    client.end();
    if (delivered) {
      createDelivery(id, deliverytext, done.bind(this));
      return;
    }
    if (err) return console.log(err);
    done();
  });
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

function getInventory(cb) {
  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      return cb('Unknown error. Contact admin.');
    }

    var query = 'SELECT inventory.id, name, description, price, quantity FROM inventory JOIN items ON inventory.item_id = items.id';
    client.query(query, function (err, result) {
      client.end();
      if (err) {
        console.log(err);
        return cb('Unknown error. Contact admin.');
      }

      cb(null, result.rows);
    });
  });
}

function checkItems(items, userid, cb) {
  var ids = items.map(function (item) {
    return parseInt(item.id);
  });
  console.log(ids);
  joined_ids = ids.join(',');
  console.log(joined_ids);
  client = new pg.Client(creds);
  client.connect();
  client.query('BEGIN', function (err) {
    if (err) {
      rollback(client);
      return cb(err);
    }

    var query = 'SELECT inventory.id, item_id, name, description, price, quantity FROM inventory JOIN items ON inventory.item_id = items.id WHERE inventory.id IN (' + joined_ids + ')';
    client.query(query, function (err, result) {
      if (err) {
        rollback(client);
        return cb(err);
      }

      var inventory_items = result.rows;;

      // oh my god i'm so tired 
      items = items.map(function (item) {
        var item_id = inventory_items.filter(function (row) { return row.id == item.id; })[0].item_id;
        item.item_id = item_id;
        return item;
      });

      var haveEnough = inventory_items.reduce(function (prev, curr) {
        var item = items.filter(function (item) { return item.id == curr.id })[0];
        return prev && item.quantity < curr.quantity;
      }, true);

      if (!haveEnough) {
        rollback(client);
        return cb('Not enough items');
      }

      console.log('success!');

      var query = 'INSERT INTO orders (user_id, completed) VALUES ($1, $2) RETURNING id';
      client.query(query, [userid, false], function (err, result) {
        if (err) return cb('order insertion failed');

        var id = result.rows[0].id;

        console.log(id);

        client.on('error', function (err) {
          console.log(err);
        });

        var query1 = 'INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)';
        var query2 = 'UPDATE inventory SET quantity = (quantity - $1) WHERE id = $2';
        var stuff = items.forEach(function (item) {
          var quantity = parseInt(item.quantity);
          client.query(query1, [id, parseInt(item.item_id), item.quantity]);
          client.query(query2, [quantity, item.id]);
        });
        client.query('COMMIT', client.end.bind(client));
        cb(null, id);
      });
    });
  });
}

function rollback(client) {
  client.query('ROLLBACK', function() {
    client.end();
  });
}

function getOrders(userid, cb) {
  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      return cb('Unknown error. Contact admin.');
    }

    var query = "SELECT orders.id, created, completed, delivery_id, to_char(pickup, 'YYYY-MM-DD') AS pickup FROM orders LEFT JOIN deliveries ON delivery_id = deliveries.id WHERE user_id = $1";
    client.query(query, [userid], function (err, result) {
      client.end();
      if (err) return cb(err);

      cb(null, result.rows);
    });
  });
}

function createDelivery(order_id, delivery_text, cb) {
  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      return cb(err);
    }

    var query = 'INSERT INTO deliveries (location) VALUES ($1) RETURNING id';
    client.query(query, [delivery_text], function (err, result) {
      if (err) return cb(err);

      var id = result.rows[0].id;

      var query = 'UPDATE orders SET delivery_id = $1 WHERE id = $2';
        client.query(query, [id, order_id], function (err, result) {
          client.end();
          if (err) return cb(err);

          cb(null);
        });
    });
  });
}
