var pg = require('pg');

exports.index = function (req, res) {
  res.locals.orders = true;
  getOrders(req.session.userid, function (err, orders) {
    res.render('orders.dust', {
      orders: orders
    });
  });
};

exports.get = function (req, res) {
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
      console.log(result);
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
};

exports.create = function (req, res) {
  res.locals.orders = true;
  var id = req.params.id;
  var delivered = req.body.delivery;
  var deliverytext = req.body.deliverytexct;
  var delivery_id = (delivered) ? req.body.delivery_id : null;
  var pickup = req.body.pickup;
  var pickuptime = null;
  var completed = req.body.completed || false;

  var done = function (err) {
		res.redirect('/orders/' + id);
  };

  if (pickup) {
    pickuptime = req.body.pickuptime;
  }

  var query = "UPDATE orders SET pickup = $1, delivery_id = $2, completed = $3 WHERE id = $4";
  client = new pg.Client(creds);
  client.connect();
  client.query(query, [pickuptime, delivery_id, completed, id], function (err, result) {
    client.end();
    if (err) return console.log(err);
    if (delivered) {
      createDelivery(id, deliverytext, function () {
				done();
			});
      return;
    } else {
			done();
		}
  });
};

function getOrders(userid, cb) {
  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      return cb('Unknown error. Contact admin.');
    }

    var query = "SELECT orders.id, created, completed, delivery_id, to_char(pickup, 'YYYY-MM-DD') AS pickup FROM orders LEFT JOIN deliveries ON delivery_id = deliveries.id WHERE user_id = $1 ORDER BY completed ASC, created DESC";
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
