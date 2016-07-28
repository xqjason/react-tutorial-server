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
var apiRoutes = express.Router(); 
var bodyParser = require('body-parser');
var jsforce = require('jsforce');
var session = require('express-session');
var jwt    = require('jsonwebtoken');
var User = require("./model/User.js");
var config = require("./config/config.js");


var COMMENTS_FILE = path.join(__dirname, 'comments.json');
var FORMFIELDS_FILE = path.join(__dirname, 'formField.json');

app.set('superSecret', config.secret)
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
  /*res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");*/

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
  /*res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");*/
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if(token){

    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });
  }else{
    console.log("Auth failed");
    res.status(401).send({
      message : 'Please log in first'
    });
  }
};

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
    var user = new User(email, password);
    var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 60 * 60 // expires in 24 hours
        });     
    /*res.redirect('/form/FormFields');*/
      return res.status(200).send({
        auth : true,
        token : token,
        username : user.email
      });
    }else{
      return res.status(401).send("Wrong username or password");
    }
});

app.delete('/session/logout', function (req, res) {
  //Sending new csrf to client when user logged out
  //for next user to sign in without refreshing the page
  req.session.user = null;
  //req.session._csrf = uid(24);
  //must send the status code in order to kick the procedures in .done
  res.status(200).send({
    logout : "success"
  });
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});
