var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  id: String,
  name: String,
  password: String,
  imageURL: String,
  followers: [String],
  following: [String]
});

module.exports = userSchema;

// called on instances of the user object
userSchema.methods.makeEmberUser = function (loggedInUser) {
  var emberUser = {
    id: this.id,
    name: this.name,
    imageURL: this.imageURL,
    isFollowed: userUtils.isFollowed(this, loggedInUser)
  };
  return emberUser;
};


// called on the model ie user
userSchema.statics.createUser = function(user, done) {


	
}