var pg = require('pg');

/* POST to login */
exports.login = function (req, res) {
  var email = req.body.email;
  var pass = req.body.pass;

  if (!(email && pass)) return res.redirect('/');

  pg.connect(pgConnString, function (err, client, done) {
    if (err) {
      done();
      console.log(err);
      req.session.error = 'Unknown error. Contact admin.';
      return res.redirect('/');
    }

    var query = 'SELECT id FROM users WHERE email = $1 LIMIT 1';
    client.query(query, [email], function (err, result) {
      if (err) {
        done();
        console.log(err);
        req.session.error = 'Unknown error. Contact admin.';
        return res.redirect('/');
      }

      if (result.rows.length != 0) {
        var id = result.rows[0].id;
        var vote_hash = result.rows[0].vote_hash;
      }

      if (!id) {
        // create new user
        query = 'INSERT INTO users (email, pass) VALUES ($1, crypt($2, gen_salt($3))) RETURNING id, vote_hash';
        client.query(query, [email, pass, 'md5'], function (err, result) {
          done();
          if (err) {
            console.log(err);
            req.session.error = 'Unknown error. Contact admin.';
            return res.redirect('/');
          }

          req.session.userid = result.rows[0].id;
          req.session.vote_hash = result.rows[0].vote_hash;
          req.session.email = email;
          req.session.success = 'Registered new user: ' + email;

          res.redirect('/');
        });
      } else {
        // attempt to log in
        query = 'SELECT pass = crypt($1, pass) AS check FROM users WHERE id = $2';
        client.query(query, [pass, id], function (err, result) {
          done();
          if (err) {
            console.log(err);
            req.session.error = 'Unknown error. Contact admin.';
            return res.redirect('/');
          }

          if (result.rows[0].check) {
            req.session.userid = id;
            req.session.email = email;
            req.session.vote_hash = vote_hash;
          } else {
            req.session.error = 'Login failed.';
          }

          res.redirect('/');
        });
      }
    });
  });
};

/* GET to logout */
exports.logout = function (req, res) {
  delete req.session.userid;
  delete req.session.email;

  res.redirect('/');
};
