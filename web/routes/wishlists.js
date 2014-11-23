var pg = require('pg');

exports.index = function (req, res) {
  client = new pg.Client(creds);
  var query = "SELECT * FROM wishlists";
  client.connect();
  client.query(query, function (err, result) {
    client.end();
    if (err) {
      console.log(err);
      req.session.error = err;
      return res.redirect('/');
    }
    res.render('wishlists.dust', {
			wishlists: result.rows
    });
  });
};

exports.get = function (req, res) {
	res.render('wishlist.dust');
};

exports.create = function (req, res) {
	var text = req.body.text;

	if (!text) {
		return res.redirect('/wishlist');
	}

  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      req.session.error = err;
      return res.redirect('/');
    }

		var query = "INSERT INTO wishlists (text) VALUES ($1)";
    client.query(query, [text], function (err, result) {
      if (err) {
        client.end();
        console.log(err);
        req.session.error = err;
        return res.redirect('/wishlist');
      }
			res.redirect('/wishlists');
    });
  });
};
