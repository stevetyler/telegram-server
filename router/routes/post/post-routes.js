// var exports = module.exports = {};
var db = require('../../../database/database');
var logger = require('nlogger').logger(module);
var router = require('express').Router(); // Router middleware
var userUtils = require('../user/user-utils');

// import ensureAuthenticated middleware
var ensureAuthenticated = require('../../../middlewares/ensure-authenticated').ensureAuthenticated;
var Twitter = require('twitter');
var configAuth = require('./../../../auth');

var User = db.model('User');
var Post = db.model('Post');

var FavImporter = require("../../../lib/import-favs.js");
  
/*
* Requesting posts for My Stream or User Stream
*/

router.get('/', function(req, res) {
  console.log(req.query.operation);
  if (req.query.operation === 'myStream') {
    // logger.info('GET posts for myStream');
    getMyStreamPosts(req, res);
  } else if (req.query.operation === 'userPosts') {
    // logger.info('GET posts for user/index route');
    getUserPosts(req, res);
  } else if (req.query.operation === 'importFavs') {

    getTwitterFavs(req, res);
  }
  else {
    return res.status(500).end();
  }
});

/*
* Creating a post from MyStream
*/

router.post('/', ensureAuthenticated, function(req, res) {
  var post = {
    user: req.body.post.user,
    createdDate: req.body.post.createdDate,
    body: req.body.post.body
  };

  if (req.user.id === req.body.post.user) {
    var newPost = new Post(post);

    newPost.save(function(err, post) {
      if (err) {
        // sends different error from browser to identify origin
        res.status(501).end();
      }
      // copy of post
      var emberPost = {
        id: post._id, // created by Mongo when saved is called
        user: post.user,
        body: post.body,
        createdDate: post.createdDate
      };
      return res.send({'post': emberPost});
    });
  }
  else {
    return res.status(401).end();
  }
});

router.delete('/:id', ensureAuthenticated, function(req, res) {
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
          var usr = user.makeEmberUser(loggedInUser);
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

function getTwitterFavs(req, res) {
  var emberPosts = [];

  console.log('Get Twitter Favs');
  console.log(req.user.twitterAccessToken, req.user.twitterSecretToken);
  
  // manual import, pass whole user not just id which is inefficient
  FavImporter.importFavs(req.user, function(err, posts) {
    if (err) {
      return res.status(400).end();
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


