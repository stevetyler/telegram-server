// var exports = module.exports = {};

var db = require('../../../database/database');
var logger = require('nlogger').logger(module);
var router = require('express').Router(); // Router middleware
var userUtils = require('../user/user-utils');

var User = db.model('User');
var Post = db.model('Post');

/*
* Requesting posts for My Stream or User Stream
*/

router.get('/', function(req, res) {
  if (req.query.operation === 'myStream') {
    // logger.info('GET posts for myStream');
    getMyStreamPosts(req, res);
  } else if (req.query.operation === 'userPosts') {
    // logger.info('GET posts for user/index route');
    getUserPosts(req, res);
  } else {
      return res.status(500).end();
  }
});

/*
* Creating a post from MyStream
*/

router.post('/', userUtils.ensureAuthenticated, function(req, res) {
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

router.delete('/:id', userUtils.ensureAuthenticated, function(req, res) {
  Post.remove({ _id: req.params.id }, function (err) {
    if (err) {
      console.log(err);
      return res.status(404).end();
    }
    return res.send({});
  });
});

// router.getMyStreamPosts method ?
function getMyStreamPosts (req, res) {
  var users = [];
  var query = {};
  var emberPosts = [];
  var loggedInUser = req.user;

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
          var usr = makeEmberUser(user, loggedInUser);
          postsUsers.push(usr);
        });
        logger.info(postsUsers);
        return res.send({posts: emberPosts, users: postsUsers});
      });
    });
  }
}

function getUserPosts(req, res) {
  var emberPosts = [];
  var query = {user: req.query.user};

  Post.find(query, function(err, posts) {
    if (err) {
      // console.log('sending 404');
      return res.status(404).end();
    }
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

module.exports = router;


