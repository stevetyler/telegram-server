var bcrypt = require('bcrypt');
var logger = require('nlogger').logger(module);
var userUtils = exports; // why not module.exports = userUtils ??

userUtils.ensureAuthenticated = function (req, res, done) {
  // Express authentication function using Passport
  if (req.isAuthenticated()) {
    return done();
  }
  else {
    return res.status(403).end();
  }
};

// returns true if user is followed by loggedInUser
userUtils.isFollowed = function (user, loggedInUser) {
  if (loggedInUser) {
    var userIsFollowing = loggedInUser.following.indexOf(user.id) !== -1 ? true : false;
    // logger.info('The loggedin user is following user \'' + user.id + '\': ', userIsFollowing);
    return userIsFollowing ? true : false;
  }
  return false;
};

userUtils.makeEmberUser = function (user, loggedInUser) {
  var emberUser = {
    id: user.id,
    name: user.name,
    imageURL: user.imageURL,
    isFollowed: isFollowed(user, loggedInUser)
  };
  return emberUser;
};

userUtils.encryptPassword = function (savedPassword, cb) {
  bcrypt.genSalt(10, function(err, salt) {
    if (err) {
      logger.error('genSalt: ', err);
    }
    logger.info('bcrypt: ', salt);
    bcrypt.hash(savedPassword, salt, function(err, hash) {
      if (err) {
        logger.error('Hash Problem: ', err);
        return res.status(403).end();
      }
      logger.info('Hashed Password: ', hash);
      return cb(err, hash);
    });
  });
};


// module.exports = userUtils;


