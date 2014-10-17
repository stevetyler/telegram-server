var mongoose = require('mongoose');
var db = mongoose.connection;

mongoose.connect('mongodb://localhost/test');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {

});

var kittySchema = mongoose.Schema({
	name: String
});

var Kitten = mongoose.model('Kitten', kittyschema);

var silence = new Kitten({name: 'Silence'});
console.log(silence.name);

// NOTE: methods must be added to the schema before compiling it with mongoose.model()
kittySchema.methods.speak = function () {
  var greeting = this.name ? "Meow name is " + this.name : "I don't have a name";
  console.log(greeting);
};

var Kitten = mongoose.model('Kitten', kittySchema);

var fluffy = new Kitten({ name: 'fluffy' });
fluffy.speak(); // "Meow name is fluffy"

fluffy.save(function (err, fluffy) {
  if (err) return console.error(err);
  fluffy.speak();
});

Kitten.find(function (err, kittens) {
  if (err) return console.error(err);
  console.log(kittens);
});

Kitten.find({ name: /^Fluff/ }, callback);

