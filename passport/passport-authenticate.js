var bcrypt = require('bcrypt');
var db = require('./../database/database');
var LocalStrategy = require('passport-local').Strategy;
var logger = require('nlogger').logger(module);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var configAuth = require('./../auth'); // import Twitter consumer key & secret

var User = db.model('User');

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({id: username}, function (err, user){
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, null, {message: 'Incorrect username'});
      }
      bcrypt.compare(password, user.password, function(err, res) {
        if (err) {
          logger.error('Bcrypt password compare error: ', err);
        }
        if (res) {
          // logger.info('Bcrypt passed: ', res);
          // logger.info('local returning user: ', user.id);
          return done(null, user);
        } else {
          // logger.warn('Bcrypt failed: ', 'query: ',password);
          // logger.warn( ' user.password: ', user.password);
          return done(null, false, { message: 'Incorrect password.' } );
        }
      });
    });
  }
));
 
passport.use(new TwitterStrategy({
    // pull in our app consumer key and secret from auth.js file
    consumerKey: configAuth.twitterAuth.consumerKey,
    consumerSecret: configAuth.twitterAuth.consumerSecret,
    callbackURL: configAuth.twitterAuth.callbackURL
  },
  // twitter will send back token and profile
  function(token, tokenSecret, profile, done) {
    User.findOne({ id: profile.id }, function(err, user) {
      logger.info('user found from twitter: ', profile);
      if(err) {
        done(err);
      }
      if(user) {
        return done(null, user); // if user is found, log them in
      } else {

        var newUser = {};

        // newUser.id = profile.id;


        User.create(newUser, function(err, user) {
          if (err) {
            logger.error('User not Created', err);
            done(err);
          }
          logger.info('User Created: ', user.id);
          return done(null, user);
        });
      }
    });
  })
);



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  // Async function, done was being called every time
  User.findOne({id: id}, function(err, user) {
    if (err) {
      return done(err);
    }
    return done(null, user);
  });
});



module.exports = passport;