var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

// passport config
var User = require('./models/user');
passport.use(new LocalStrategy({usernameField: "email"}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(passport.initialize());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db = mongoose.connection;

// Connect to the database before starting the application server.
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // Initialize the app.
  var server = app.listen(process.env.PORT || 5000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });

});

app.post('/signup', function(req, res) {
  console.log("Creating new user:", req.body);
  var password = req.body.password;
  delete req.body['password'];
  User.register(new User(req.body), password, function(err, user) {
    if (err) {
      handleError(res, err.message, "Failed to create new user.");
    }

    res.status(201).json(user);
  });
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { handleError(res, err.message, "Error authenticating in user."); }
    if (!user) { return res.status(401).json("User not found."); }
    req.logIn(user, function(err) {
      if (err) { handleError(res, err.message, "Error logging in user."); }
      return res.status(200).json({'user_id': user._id });
    });
  })(req, res, next);
});

app.post('/matches', function(req, res) {
  var UserModel = mongoose.model('User', User);
  UserModel.findById(req.body.user_id, function(err, user) {
    if (err) { return handleError(res, err.message, "No user to match."); }
    var query = {
      'age': { $gte: user.preferences.age.min, $lte: user.preferences.age.max },
      'gender': { $in: user.preferences.gender },
      'height': { $gte: user.preferences.height.min, $lte: user.preferences.height.max },
      'religion': { $in: user.preferences.religion },
      'preferences.gender': user.gender,
      'preferences.age.max': { $gte: user.age }, 
      'preferences.age.min': { $lte: user.age }, 
      'preferences.height.max': { $gte: user.height },
      'preferences.height.min': { $lte: user.height },
      'preferences.religion': user.religion
    };
    var search = UserModel.find(query).limit(5);
    search.exec(function (err, matches) {
      if (err) { return handleError(res, err.message, "Error getting matches."); }
      return res.status(200).json(matches); 
    });
  });
});
