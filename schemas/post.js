var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
  id: String,
  user: String,
  ownedBy: String,
  createdDate: Date,
  body: String
});

module.exports = postSchema;