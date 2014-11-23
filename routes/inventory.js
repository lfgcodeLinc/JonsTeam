var pg = require('pg');

exports.index = function (req, res) {
  res.locals.inventory = true;

  getInventory(function (err, items) {
    res.render('inventory.dust', {
      items: items
    });
  });
};

exports.checkout = function (req, res) {
  if (!req.session.userid || !req.session.teacher) {
    return res.json({
      error: 'You need to <a href="/register">register</a> as a teacher in order to check out.'
    });
  }

  if (!req.body.items) {
    return res.json({});
  }

  checkItems(req.body.items, req.session.userid, function (err, id) {
    if (err) {
      console.log(err);
      res.json({
        error: err
      });
    } else {
      res.json({id: id});
    }
  });
};

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

      var inventory_items = result.rows;

      // oh my god i'm so tired
      items = items.map(function (item) {
        var inventory_item = inventory_items.filter(function (row) { return row.id == item.id; })[0];
        item.item_id = inventory_item.item_id;
        item.price = inventory_item.price;
        return item;
      });

      var enough_stock = inventory_items.reduce(function (prev, curr) {
        var item = items.filter(function (item) { return item.id == curr.id })[0];
        return prev && item.quantity <= curr.quantity;
      }, true);

      if (!enough_stock) {
        rollback(client);
        return cb('There are not enough of those items in stock.');
      }

      var query = 'SELECT balance FROM users WHERE id = $1';
      client.query(query, [userid], function (err, result) {
        if (err) return cb(err);

        var balance = result.rows[0].balance;
        var total_cost = items.reduce(function (prev, item) {
          return prev + (item.price * item.quantity);
        }, 0);

        console.log('total cost: ' + total_cost);

        var epsilon = .00001; // floating point is hard maybe
        if (total_cost > (balance + epsilon)) {
          return cb('Not enough points. This order would cost ' + total_cost + ', but you only have ' + balance);
        }

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
          var query3 = 'UPDATE users SET balance = (balance - $1) WHERE id = $2';
          items.forEach(function (item) {
            var quantity = parseInt(item.quantity);
            var price = parseInt(item.price);
            client.query(query1, [id, parseInt(item.item_id), item.quantity]);
            client.query(query2, [quantity, item.id]);
            client.query(query3, [quantity * price, userid]);
          });
          client.query('COMMIT', function () {
            client.end();
            cb(null, id);
          });
        });
      });
    });
  });
}

function rollback(client) {
  client.query('ROLLBACK', function() {
    client.end();
  });
}
