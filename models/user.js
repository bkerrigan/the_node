var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    email: String,
    age: Number,
    gender: String,
    height: Number,
    name: { first: String, last: String },
    religion: String,
    preferences: {
      age: { max: Number, min: Number },
      gender: [String],
      height: { max: Number, min: Number },
      religion: [String]
    }
});

User.plugin(passportLocalMongoose, {
    usernameField: "email",
    usernameLowerCase: true
  });

module.exports = mongoose.model('User', User);
