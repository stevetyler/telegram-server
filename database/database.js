var logger = require('nlogger').logger(module);
logger.info('load database.js');

var mongoose = require('mongoose');
var userSchema = require('../schemas/user');
var postSchema = require('../schemas/post');


 

mongoose.connect('mongodb://localhost/telegram');

mongoose.connection.model('User', userSchema);
mongoose.connection.model('Post', postSchema);

// var User = mongoose.connection.model('User');
// var Post = mongoose.connection.model('Post');


module.exports = mongoose.connection;