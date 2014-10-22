
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
// app.use(express.static('public'));
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
    // done(null, null);
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
    var user;
    
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
                        return res.send({'user': req.body.user});
                    });
                });
            }
        });
    }
});

app.get('/api/users/:id', function(req, res) {
    var userId = req.params.id;

    User.findOne({id: userId}, function(err, user) {
        if (err) {
            return res.status(500).end();
        }
        if (!user) {
            return res.status(404).end();
        }
        res.send({'user': user});
    });
});


// Posts route requests

app.get('/api/posts', function(req, res) {

    Post.find({}, function(err, posts) {
        var emberPosts = [];

        if (err) {
            console.log('sending 404');
            // need to return or code will continue executing
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

// Logout requests
app.get('/api/logout', function(req, res) {
    req.logout();
    res.status(200).end();
});





