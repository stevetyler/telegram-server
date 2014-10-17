
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	id: String,
	name: String,
	password: String,
	imageURL: String,
	operation: String,
	followers: [String],
	following: [String]
});

module.exports = userSchema;

// var users = [{
//         id: 'stevetyler',
//         name: 'Steve Tyler',
//         password: 'steve',
//         imageURL: '/assets/img/users/stevetyler.png',
//         operation: 'login'
//     }, {
//         id: 'vivhoford',
//         name: 'Vivien Hoford',
//         password: 'vivien',
//         imageURL: '/assets/img/users/vivhoford.png',
//         operation: 'login'
//     }, {
//         id: 'rachelblanton',
//         name: 'Rachel Blanton',
//         password: 'rachel',
//         imageURL: '/assets/img/users/rachelblanton.png',
//         operation: 'login'
//     }];