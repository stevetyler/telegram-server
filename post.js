
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
	id: String,
	user: String,
	createdDate: Date,
	body: String
});

module.exports = postSchema;

// var posts = [{
//         id: 'id1',
//         user: 'stevetyler',
//         createdDate: new Date(2014, 8, 5),
//         body: 'Ember is great!',
//     }, {
//         id: 'id2',
//         user: 'vivhoford',
//         createdDate: new Date(2014, 8, 6),
//         body: 'What\'s Ember?',

//     }, {
//         id: 'id3',
//         user: 'rachelblanton',
//         createdDate: new Date(2014, 8, 8),
//         body: 'I have no idea what you\'re talking about',
//     }];