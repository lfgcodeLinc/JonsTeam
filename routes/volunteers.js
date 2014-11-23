var pg = require('pg');

exports.index = function (req, res) {
  var userid = req.session.userid;
  if (!userid) {
    return res.render('register.dust', {
      error: 'Please register so you can sign up to volunteer!'
    });
  }
  client = new pg.Client(creds);
  var query = "SELECT *, to_char(date, 'YYYY-MM-DD') AS date FROM volunteers WHERE user_id = $1";
  client.connect();
  client.query(query, [userid], function (err, result) {
    client.end();
    if (err) {
      console.log(error);
      req.session.error = err;
      return res.redirect('/');
    }
    res.render('volunteers.dust', {
      volunteers: result.rows
    });
  });
};

exports.get = function (req, res) {
  var id = req.params.id;
  var userid = req.session.userid;
  client = new pg.Client(creds);
  client.connect();
  var query = "SELECT *, to_char(date, 'YYYY-MM-DD') AS date FROM volunteers WHERE user_id = $1 AND id = $2";
  client.query(query, [userid, id], function (err, result) {
    client.end();
    if (err) {
      console.log(error);
      req.session.error = err;
      return res.redirect('/volunteer');
    }
    var data = result.rows[0];
    res.render('volunteer.dust', data);
  });
};

exports.delete = function (req, res) {
  var id = req.params.id;
  var userid = req.session.userid;
  client = new pg.Client(creds);
  client.connect();
  var query = 'DELETE FROM volunteers WHERE user_id = $1 AND id = $2';
  client.query(query, [userid, id], function (err, result) {
    client.end();
    if (err) {
      console.log(err);
      req.session.error = err;
      return res.redirect('/volunteers');
    }
    res.redirect('/volunteers');
  });
};

exports.create = function (req, res) {
  var userid = req.session.userid;
  var id = req.body.id;
  var date = req.body.date;
  var availability = req.body.availability;

  client = new pg.Client(creds);
  client.connect(function (err) {
    if (err) {
      client.end();
      console.log(err);
      req.session.error = err;
      return res.redirect('/');
    }

    if (id) {
      var query = 'UPDATE volunteers SET (user_id, date, availability) = ($1, $2 ,$3) WHERE id = $4 AND user_id = $1';
      var params = [userid, date, availability, id];
    } else {
      var query = 'INSERT INTO volunteers (user_id, date, availability) VALUES ($1, $2 ,$3)';
      var params = [userid, date, availability];
    }
    client.query(query, params, function (err, result) {
      if (err) {
        client.end();
        console.log(error);
        req.session.error = err;
        return res.redirect('/volunteer');
      }

      var query = "SELECT *, to_char(date, 'YYYY-MM-DD') AS date FROM volunteers WHERE user_id = $1";
      client.query(query, [userid], function (err, result) {
          client.end();
        if (err) {
          console.log(error);
          req.session.error = err;
          return res.redirect('/volunteer');
        }
        res.render('volunteers.dust', {
          volunteers: result.rows
        });
      });
    });
  });
};
