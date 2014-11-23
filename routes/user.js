var pg = require('pg');

/* POST to login */
exports.login = function (req, res) {
  var email = req.body.email;
  var pass = req.body.pass;

  if (!(email && pass)) return res.redirect('/');

  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      req.session.error = 'Unknown error. Contact admin.';
      return res.redirect('/');
    }

    var query = 'SELECT id FROM users WHERE email = $1 LIMIT 1';
    client.query(query, [email], function (err, result) {
      if (err) {
        client.end();
        console.log(err);
        req.session.error = 'Unknown error. Contact admin.';
        return res.redirect('/');
      }

      if (result.rows.length != 0) {
        var id = result.rows[0].id;
      }

      if (!id) {
        return res.redirect('/register');
      }

      // attempt to log in
      query = 'SELECT teacher, pass = crypt($1, pass) AS check FROM users WHERE id = $2';
      client.query(query, [pass, id], function (err, result) {
        client.end();
        if (err) {
          console.log(err);
          req.session.error = 'Unknown error. Contact admin.';
          return res.redirect('/');
        }

        if (result.rows[0].check) {
          req.session.userid = id;
          req.session.email = email;
          req.session.teacher = result.rows[0].teacher;
          if (req.session.teacher) {
            req.session.cart = [];
          }
        } else {
          req.session.error = 'Login failed.';
        }

        res.redirect('/');
      });
    });
  });
};

/* GET to logout */
exports.logout = function (req, res) {
  delete req.session.userid;
  delete req.session.email;
  delete req.session.teacher;

  res.redirect('/');
};

exports.register = function (req, res) {
  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      req.session.error = 'Unknown error. Contact admin.';
      return res.redirect('/');
    }

    var query = 'SELECT * FROM schools';
    client.query(query, function (err, result) {
      if (err) {
        client.end();
        console.log(err);
        req.session.error = 'Unknown error. Contact admin.';
        return res.redirect('/');
      }

      res.render('register.dust', {
        schools: result.rows
      });
    });
  });
};

exports.create = function (req, res) {
  var name = req.body.name || '';
  var email = req.body.email;
  var pass = req.body.pass;
  var school = req.body.school || 0;
  var phone = req.body.phone || null;
  var teacher = req.body.teacher || false;

  if (!(email && pass)) return res.redirect('/');
  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      req.session.error = 'Unknown error. Contact admin.';
      return res.redirect('/');
    }

    // create new user
    var query = 'INSERT INTO users (name, email, pass, phone, balance, school_id, teacher) VALUES ($1, $2, crypt($3, gen_salt($4)), $5, $6, $7, $8) RETURNING id';
    client.query(query, [name, email, pass, 'md5', phone, 25, school, teacher], function (err, result) {
      client.end();
      if (err) {
        console.log(err);
        if (err.code === '23505') {
          req.session.error = 'Email already registered.';
        } else {
          req.session.error = 'Unknown error. Contact admin.';
        }
        return res.redirect('/');
      }

      req.session.userid = result.rows[0].id;
      req.session.email = email;
      req.session.success = 'Registered new user: ' + email;

      res.redirect('/');
    });
  });
};
