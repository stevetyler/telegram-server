var mongoose = require('mongoose');
var userSchema = require('./user');
var postSchema = require('./post');

mongoose.connect('mongodb://localhost/telegram');

mongoose.model('User', userSchema);
mongoose.model('Post', postSchema);

module.exports = mongoose.connection;