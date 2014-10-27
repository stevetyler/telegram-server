
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var logger = require('nlogger').logger(module);

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

mongoose.connection.model('User', userSchema);
mongoose.connection.model('Post', postSchema);

var User = mongoose.connection.model('User');
var Post = mongoose.connection.model('Post');

// Middleware
// app.use(express.static('public')); not needed
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
    secret: 'keyboard cat', // what is this??
    resave: true,  // forces session to be saved even when unmodified
    saveUninitialized: true,  // forces a new unmodified session to be saved to the store. 
    rolling: false  // reset expiration date setting cookie on every response
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
            return done(null, user, null);
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

function ensureAuthenticated(req, res, done) {
    if (req.isAuthenticated()) {
        return done();
    }
    else {
        return res.status(403).end();
    }
}


// Users route requests 

app.get('/api/users', function(req, res) {
    var operation = req.query.operation;
    var user, userId, loggedInUser;
    
    // use forEach to convert user to emberUser in all arrays eg posts

    if (operation === 'login') {
        passport.authenticate('local', function(err, user, info) {
            logger.info(user);
            if (err) {
                // sends status only.
                return res.status(500).end();
            }
            if (!user) {
                return res.status(404).end();
            }
            // sets cookie
            req.logIn(user, function(err) {
                if (err) {
                    return res.status(500).end();
                }
                return res.send({'users': [user]});
            });
        })(req, res);
    }

    else if (req.query.followUserId) { 
        loggedInUser = req.user;
        // add followerUserId to followersOf array and vice versa
        User.findOneAndUpdate(
            {id: followUserId}, // query
            {$push: {followers: loggedInUser}}, // use addToSet instead?
            function (err, user) {
                if (err) {
                    return res.send(403);
                }
                else {
                    return {'user': user.id};
                }
            }

        );

        // async won't work, use callback ?
        User.findOneAndUpdate(
            {id: loggedInUser}, // query
            {$push: {following: followUserId}}, // use addToSet instead?
            function (err, user) {
                if (err) {
                    return res.send(403);
                }
                else {
                    return {'user': user.id};
                }
            }

        );
        
    }

    else if (req.query.unFollowUserId) {
        loggedInUser = req.user;
        // add followerUserId to followersOf array and vice versa
        User.findOneAndUpdate(
            {id: unFollowUserId}, // query
            {$pull: {followers: loggedInUser}}, // use addToSet instead?
            function (err, user) {
                if (err) {
                    return res.send(403);
                }
                else {
                    return {'user': user.id};
                }
            }
        );

        // async won't work, use callback ?
        User.findOneAndUpdate(
            {id: loggedInUserId}, // query
            {$pull: {following: unFollowUserId}}, // use addToSet instead?
            function (err, user) {
                if (err) {
                    return res.send(403);
                }
                else {
                    return {'user': user.id};
                }
            }
        );
        
    }

    else if (req.query.followersOf) {
        userId = req.query.followersOf;

        console.log('success');
        User.findOne({id: userId}, function(err, user) {
            if (err) {
                console.log(err);
                return res.status(404).end();
            }
            var followersIds = user.followers;
            User.find({id: {$in:followersIds}}, function(err, users) {
                if (err) {
                    return res.status(400).end();
                }
                return res.send({'users': users});
            });
          
        });
    }
    else if (req.query.followedBy) {
        userId = req.query.followedBy;

        console.log('success');
        User.findOne({id: userId}, function(err, user) {
            if (err) {
                console.log(err);
                return res.status(404).end();
            }
            var followingIds = user.following;
            User.find({id: {$in:followingIds}}, function(err, users) {
                if (err) {
                    return res.status(400).end();
                }
                return res.send({'users': users});
            });
          
        });
    }


    else if (operation === 'authenticated') {
        if (req.isAuthenticated()) {
            return res.send({'users': [req.user]});
        }
        else {
            return res.send({'users': []});
        }
    }
    else {
        User.find({}, function(err, users) {
            if (err) {
                return res.status(500).end();
            }
            return res.send({'users': users});
        });
    }
});

app.post('/api/users', function(req, res) {
    if (req.body.user) {
        User.findOne({id: req.body.user.id}, function (err, user) {
            if (user) {
                // user already exists
                res.status(400).end();
            }
            else {
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
        });
    }
});

// returns true if user is followed by loggedInUser or otherwise false
function isFollowed(user, loggedInUser) {
    var loggedInUserId = loggedInUser.id;
    // check if loggedInUser exists in user.followers array
    User.findOne({id: user.id, $in: {followers: loggedInUserId}}, 
        function(err, user) {
            if (err) {
                console.log(err);
                return res.status(404).end();
            }
            else if (user) {
                return true;
            }
            else {
                return false;
            } 
        });

    // return true if user is followed by loggedInUser
    // check inside objects 
}

function makeEmberUser(user, loggedInUser) {
    var emberUser = {
            id: user.id,
            name: user.name,
            imageURL: user.imageURL,
            followed: isFollowed(user, loggedInUser)
        };
    return emberUser;
}



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

// Posts route requests

app.get('/api/posts', function(req, res) {
    
    var emberPosts = [];
    var query = {};
    // Find and send all posts authored by req.query.ownedBy
    if (req.query.ownedBy) {
        query = {user: req.query.ownedBy};
        console.log('success');
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
            });
            return res.send({'posts': emberPosts});
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

app.get('/api/logout', function(req, res) {
    req.logout();
    res.status(200).end();
});






