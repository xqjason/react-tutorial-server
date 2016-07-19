/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jsforce = require('jsforce');
var session = require('express-session');
var User = require("./model/User.js");



var COMMENTS_FILE = path.join(__dirname, 'comments.json');
var FORMFIELDS_FILE = path.join(__dirname, 'formField.json');

app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session(({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
})));

// Additional middleware which will set headers that we need on each request.
app.use(function(req, res, next) {
    // Set permissive CORS header - this allows this server to be used only as
    // an API server in conjunction with something like webpack-dev-server.
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Disable caching so we'll always get the latest comments.
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

app.get('/api/comments', function(req, res) {
  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    res.json(JSON.parse(data));
  });
});

app.get('/form/FormFields', Auth, function(req, res) {
  fs.readFile(FORMFIELDS_FILE, function(err, data) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  res.json(JSON.parse(data));
  });

});

app.get('/form/FormFieldsNoAuth', function(req, res) {
  fs.readFile(FORMFIELDS_FILE, function(err, data) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  res.json(JSON.parse(data));
  });

});

app.post('/api/comments', function(req, res) {
  fs.readFile(COMMENTS_FILE, function(err, data) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    var comments = JSON.parse(data);
    // NOTE: In a real implementation, we would likely rely on a database or
    // some other approach (e.g. UUIDs) to ensure a globally unique id. We'll
    // treat Date.now() as unique-enough for our purposes.
    var newComment = {
      id: Date.now(),
      author: req.body.author,
      text: req.body.text,
    };
    comments.push(newComment);
    fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 4), function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      res.json(comments);
    });
  });
});

function Auth (req, res, next) {
  if(req.session.user){
    next();
  }else{
    console.log("Auth");
    res.status(401).send({
      flash : 'Please log in first'
    });
  }
}

//Log user in
app.post('/session/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  if ( null == email || email.length < 1
      || null == password || password.length < 1 ) {
    res.status(401).send("Wrong username or password");
    return;
  }

  if (email == "jd@test.com" && password == "abc123") {
<<<<<<< HEAD
    var user = new User();
    req.session.user = user
=======
    req.session.user = new User(email, password);
>>>>>>> f435014dddd8e5cff7eae3a7f224164e91196b97
      return res.status(200).send({
        auth : true,
        user : user
      });
    }else{
      return res.status(401).send("Wrong username or password");
    }
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
