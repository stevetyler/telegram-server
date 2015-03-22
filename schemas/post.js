var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
  id: String,
  user: String,
  ownedBy: String,
  createdDate: Date,
  body: String,
  twitterTweetAuthor: String,
  twitterTweetId: String,
  twitterLastTweetId: String
});

module.exports = postSchema;