var bcrypt = require('bcrypt');
var logger = require('nlogger').logger(module);
var userUtils = exports; // why not module.exports = userUtils ??

// exports.assignAvatar is equivalent
// statics
userUtils.assignAvatar = function (id) {
  var image, path;

  switch (id) {
    case 'css-tricks' : image = 'css-tricks.jpg';
    break;
    case 'ember-london' : image = 'ember-london.jpg';
    break;
    case 'js-daily' : image = 'js-daily.jpg';
    break;
    case 'rach' : image = 'rach.jpg';
    break;
    case 'sitepoint' : image = 'sitepoint.jpg';
    break;
    case 'steve' : image = 'steve.jpg';
    break;
    case 'talent-buddy' : image = 'talent-buddy.jpg';
    break;
    case 'tech-insight' : image = 'tech-insight.jpg';
    break;
    case 'vlad' : image = 'vlad.jpg';
    break;
    default : image = 'guest.jpg';
  }
  path = '/assets/img/avatars/' + image;
  return path;
};

// create middlewares folder with ensureAuthenticated.js module.exports = function etc..
userUtils.ensureAuthenticated = function (req, res, done) {
  // Express authentication function using Passport
  if (req.isAuthenticated()) {
    return done();
  }
  else {
    return res.status(403).end();
  }
};

// methods
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
    isFollowed: userUtils.isFollowed(user, loggedInUser)
  };
  return emberUser;
};

// generic function, statics
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
