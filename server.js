var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongostore')(session);
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var passwordGenerator = require('password-generator');
var Mailgun = require('mailgun-js');
var LocalStrategy = require('passport-local').Strategy;
var logger = require('nlogger').logger(module);
var async = require('async');
var bcrypt = require('bcrypt');
// var md5 = require('MD5');
var app = express();
var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  id: String,
  name: String,
  password: String,
  imageURL: String,
  followers: [String],
  following: [String]
});

var postSchema = new Schema({
  id: String,
  user: String,
  createdDate: Date,
  body: String
});

mongoose.connect('mongodb://localhost/telegram');

var User = mongoose.connection.model('User');
var Post = mongoose.connection.model('Post');

mongoose.connection.model('User', userSchema);
mongoose.connection.model('Post', postSchema);


var api_key = 'key-7932438a6fbbbe7ced17e09c849ad26f';
var domain = 'sandboxefab4ad740d044ac9681ee7f2a19e813.mailgun.org';

var myMailgun = new Mailgun({
  apiKey: api_key, domain: domain
});

var data = {
  from: 'Telegram <telegram@mailgun.org>',
  to: '',
  subject: 'Password Reset',
  text: 'Your new password is'
};




// Middleware
// app.use(express.static('public')); not needed
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
  secret: 'keyboard cat', // what is this??
  resave: true,  // forces session to be saved even when unmodified
  saveUninitialized: true,  // forces a new unmodified session to be saved to the store. 
  rolling: false,  // reset expiration date setting cookie on every response
  store: new MongoStore({'db': 'sessions'}) // persistent sessions
}));
app.use(passport.initialize());
app.use(passport.session());

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


// Function definitions

function encryptPassword (savedPassword, cb) {
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
}

function ensureAuthenticated(req, res, done) {
  // Express authentication function using Passport
  if (req.isAuthenticated()) {
    return done();
  }
  else {
    return res.status(403).end();
  }
}

// returns true if user is followed by loggedInUser
function isFollowed(user, loggedInUser) {
    
  var followers = user.followers;
  var loggedInUserId = loggedInUser.id;

  if (followers.indexOf(loggedInUserId) !== -1) {
    return true;
  }
  else {
    return false;
  }
}

function makeEmberUser(user, loggedInUser) {
  var emberUser = {
    id: user.id,
    name: user.name,
    imageURL: user.imageURL,
    isFollowed: isFollowed(user, loggedInUser)
  };
  return emberUser;
}

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
        emberArray.push(makeEmberUser(follower, user));
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
        emberArray.push(makeEmberUser(following, user));
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


// Get requests 

app.get('/api/users', function(req, res) {
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

app.get('/api/users/:id', function(req, res) {
  var userId = req.params.id;
  var loggedInUser = req.user;

  User.findOne({id: userId}, function(err, user) {
    if (err) {
      return res.status(500).end();
    }
    if (!user) {
      return res.status(404).end();
    }
    var emberUser = makeEmberUser(user, loggedInUser);

    res.send({'user': emberUser});
  });
});

app.get('/api/posts', function(req, res) {
  var users = [];
  var emberPosts = [];
  var query = {};
  // Find and send all posts authored by req.query.ownedBy
  if (req.user) {
    var search = req.user.following;
    search.push(req.user.id);
    query = {user: {$in: search}};
    console.log(search);

    Post.find(query, function(err, posts) {
      if (err) {
        console.log(query);
        return res.status(404).end();
      }
      
      // Mongo requires _id value
      posts.forEach(function(post) {
        var emberPost = {
          id: post._id,
          user: post.user,
          body: post.body,
          createdDate: post.createdDate
        };
        emberPosts.push(emberPost);
        users.push(post.user);
      });
      User.find({id: {$in: users}}, function(err, users) {
        var postsUsers = [];
        if (err) {
          res.status(403).end();
        }
        users.forEach(function(user) {
          var usr = new User(user);
          postsUsers.push(usr);
        });
        logger.info(postsUsers);
        return res.send({posts: emberPosts, users: postsUsers});
      });
    });
  }
  else {
    // find and send all posts that we have in the database which we have in the route at the moment
    Post.find(query, function(err, posts) {
      if (err) {
        // console.log('sending 404');
        return res.status(404).end();
      }
      
      // Mongo requires _id value
      posts.forEach(function(post) {
        var emberPost = {
          id: post._id,
          user: post.user,
          body: post.body,
          createdDate: post.createdDate
        };
        emberPosts.push(emberPost);
      });
      return res.send({'posts': emberPosts});
    });
  }
});

app.get('/api/logout', function(req, res) {
  req.logout();
  res.status(200).end();
});


// Post requests

app.post('/api/users', function(req, res) {
  if (req.body.user) {
    User.findOne({id: req.body.user.id}, function (err, user) {
      if (user) {
        // user already exists
        res.status(400).end();
      }
      else {
        var password = req.body.user.password;
        async.series([
          function(done) {
            encryptPassword(password, function (err, encryptedPassword) {
              if (err) {
                done(err);
              }
              req.body.user.password = encryptedPassword;
              done(null, req.body.user);
            });
          },
          function(user, done) {
            var newUser = new User(req.body.user);
            newUser.save(function(err, user){
              if (err) {
                return res.status(500).end();
              }
              req.logIn(user, function(err) {
                if (err) {
                  return res.status(500).end();
                }
                var emberUser = makeEmberUser(req.body.user, null);
                return res.send({'user': emberUser});
              });
            });
          }
        ], function () {
          if (err) {
            res.status(500).end();
          }
          return res.send({user: newUser});
        });
      }
    });
  }
});

app.post('/api/posts', ensureAuthenticated, function(req, res) {
  var post = {
    user: req.body.post.user,
    createdDate: req.body.post.createdDate,
    body: req.body.post.body
  };

  if (req.user.id === req.body.post.user) {
    var newPost = new Post(post);
    var emberPost = {
      id: newPost._id,
      user: req.user.id,
      body: newPost.body,
      createdDate: newPost.createdDate
    };

    newPost.save(function(err, post) {
      if (err) {
        // sends different error from browser to identify origin
        res.status(501).end();
      }
      return res.send({'post': emberPost});
    });
  }
  else {
    return res.status(401).end();
  }
});

app.delete('/api/posts/:id', ensureAuthenticated, function(req, res) {
  Post.remove({ _id: req.params.id }, function (err) {
    if (err) {
      console.log(err);
      return res.status(404).end();
    }
    return res.send({});
  });
});







