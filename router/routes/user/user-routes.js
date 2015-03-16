// var exports = module.exports = {};
var async = require('async');
var db = require('../../../database/database');
var logger = require('nlogger').logger(module);
var passport = require('../../../passport/passport-authenticate');
var passwordGenerator = require('password-generator');
var router = require('express').Router(); // Router middleware
var userUtils = require('./user-utils');

var User = db.model('User');

// user get requests
router.get('/', function(req, res) {
  var operation = req.query.operation;
  var user, userId, loggedInUser;

  if (operation === 'login') { handleLoginRequest(req, res); }

  else if (operation === 'authenticated') { handleIsAuthenticatedRequest(req, res); }

  else if (operation === 'followers') { handleFollowersRequest(req, res); }

  else if (operation === 'following') { handleFollowingRequest(req, res); }

  else if (req.query.followUserId) { handleFollowRequest(req, res); }

  else if (req.query.unFollowUserId) { handleUnFollowRequest(req, res); }

  else {
    User.find({}, function(err, users) {
      if (err) {
        return res.status(500).end();
      }
      return res.send({'users': users});
    });
  }
});

router.get('/:id', function(req, res) {
  var userId = req.params.id;
  var loggedInUser = req.user;

  User.findOne({id: userId}, function(err, user) {
    if (err) {
      return res.status(500).end();
    }
    if (!user) {
      return res.status(404).end();
    }
    var emberUser = user.makeEmberUser(user, loggedInUser);

    res.send({'user': emberUser});
  });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).end();
});

router.get('/auth/twitter', passport.authenticate('twitter'), function(req, res) {
    logger.info('Redirecting to Twitter');
});

router.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect: '/my-stream', failureRedirect: '/' }));



// user post requests

router.post('/', function(req, res) {
  console.log('post log');
  if (req.body.user) {
    User.findOne({id: req.body.user.id}, function (err, user) {
      if (user) {
        // user already exists
        res.status(400).end();
      }
      else {
        User.createUser(req.body.user, function(err, user) {
          if (err) {
            return res.status(500).end();
          }
          req.logIn(user, function(err) {
            if (err) {
              return res.status(500).end();
            }
            var emberUser = user.makeEmberUser(null); // null because no loggedinuser
            return res.send({'user': emberUser});
          });
        });
      }
    });
  }
});


// function definitions

function addFollowerId(followUserId, loggedInUserId, done) {
  User.findOneAndUpdate(
    {id: followUserId}, // query
    {$push: {followers: loggedInUserId}}, // use addToSet instead?
    function (err, user) {
      if (err) {
        return done(err);
      }
      done(null);
    }
  );
}
    
function addFollowingId(loggedInUserId, followUserId, done) {
  User.findOneAndUpdate(
    {id: loggedInUserId}, // query
    {$push: {following: followUserId}},
    function (err, user) {
      if (err) {
        return done(err);
      }
      done(null);
    }
  );
}

function removeFollowerId(unFollowUserId, loggedInUserId, done) {
  User.findOneAndUpdate(
    {id: unFollowUserId}, // query
    {$pull: {followers: loggedInUserId}}, // use addToSet instead?
    function (err, user) {
      if (err) {
        return done(err);
      }
      done(null);
    }
  );
}
  
function removeFollowingId(loggedInUserId, unFollowUserId, done) {
  User.findOneAndUpdate(
    {id: loggedInUserId}, // query
    {$pull: {following: unFollowUserId}}, // use addToSet instead?
    function (err, user) {
      if (err) {
        return done(err);
      }
      done(null);
    }
  );
}

function handleFollowRequest(req, res) {
  async.parallel([
    function(done){
      var followUserId = req.query.followUserId;
      var loggedInUserId = req.user.id;
      addFollowerId(followUserId, loggedInUserId, function(err) {
        done(err); // callback function provided by async similar to done(); See TB async exercise
      });
    },
    function(done){
      var loggedInUserId = req.user.id;
      var followUserId = req.query.followUserId;
      addFollowingId(loggedInUserId, followUserId, function(err){
        done(err);
      });
    }
  ], function(err){
    if (err) {
      return res.status(500).end();
    }
    return res.send({'users': []});
  });
}

function handleUnFollowRequest(req, res) {
  async.parallel([
    function(done){
      var unFollowUserId = req.query.unFollowUserId;
      var loggedInUserId = req.user.id;

      removeFollowerId(unFollowUserId, loggedInUserId, function(err) {
        done(err);
      });
    },
    function(done){
      var unFollowUserId = req.query.unFollowUserId;
      var loggedInUserId = req.user.id;
      console.log(unFollowUserId, loggedInUserId);

      removeFollowingId(loggedInUserId, unFollowUserId, function(err) {
        done(err);
      });
    }
  ], function(err) {
    if (err) {
      return res.status(500).end();
    }
    return res.send({'users': []});
  });
}

function handleFollowersRequest(req, res) {
  var user = req.user;
  var userId = req.query.userId; // change in action
  var emberArray = [];

  logger.info('Getting followers for: ', userId);
    
  User.findOne({id: userId}, function(err, user) {
    if (err) {
      console.log(err);
      return res.status(404).end();
    }

    User.find({id: {$in: user.followers}}, function(err, followers) {
      if (err) {
        return res.status(400).end();
      }

      followers.forEach(function(follower) {
        emberArray.push(follower.makeEmberUser(user));
      });

      return res.send({'users': emberArray});
    });
  });
}

function handleFollowingRequest(req, res) {
  var user = req.user;
  var userId = req.query.userId;
  var emberArray = [];

  logger.info('Get users following : ', userId);

  User.findOne({id: userId}, function(err, user) {
    if (err) {
      console.log(err);
      return res.status(404).end();
    }

    User.find({id: {$in: user.following}}, function(err, following) {
      if (err) {
        return res.status(400).end();
      }

      following.forEach(function(following) {
        emberArray.push(following.makeEmberUser(user));
      });

      return res.send({'users': emberArray});
    });
  });
}

function handleLoginRequest(req, res) {
  // uses 'local' calback function created by new LocalStrategy
  passport.authenticate('local', function(err, user, info) {
    logger.info(user);
    if (err) {
      return res.status(500).end();
    }
    if (!user) {
      return res.status(404).end();
    }
    // req.logIn sets cookie
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).end();
      }
      return res.send({'users': [user]});
    });
  })(req, res);
}

function handleLogoutRequest(req, res) {
  // logger.info('Logging Out');
  req.logout();
  return res.send({ users: {} });
}

function handleIsAuthenticatedRequest(req, res) {
  if (req.isAuthenticated()) {
    return res.send({ users:[req.user] });
  } else {
    return res.send({ users: [] } );
  }
}

function handleResetPassword(req, res) {

}

module.exports = router;


