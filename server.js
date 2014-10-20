
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
    operation: String,
    followers: [String],
    following: [String]
});

var postSchema = new Schema({
    id: String,
    user: String,
    createdDate: Date,
    body: String
});

var User = mongoose.model('User', userSchema);
var Post = mongoose.model('Post', postSchema);

mongoose.connect('mongodb://localhost/telegram');

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({
    secret: 'keyboard cat',
    resave: true,  // forces session to be saved even when unmodified
    saveUninitialized: true,  // forces a new unmodified session to be saved to the store. 
    rolling: false  // reset expiration date setting cookie on every response
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(

    // use findOne method
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
    for (var i = 0; i < users.length; i++) {
        if (users[i]['id'] === id) {
            var user = users[i];
            return done(null, user); // return exits function or the next function will be called
        }
    }
    done(null, null);
});

function ensureAuthenticated(req, res, done) {
    if (req.isAuthenticated()) {
        return done();
    }
    else {
        return res.status(403).end();
    }
}

// REST adapter makes request
app.get('/api/users', function(req, res) {
    var operation = req.query.operation;
    var user;

    if (operation === 'authenticated') {
        if (req.isAuthenticated()) {
            return res.send({'users': [req.user]});
        }
        else {
            return res.send({'users': []});
        }
    }
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
    else {
        return res.send({'users': []});
    }
});

app.get('/api/posts', function(req, res) {
        res.status(200).send({'posts': posts});
});

app.get('/api/users/:id', function(req, res) {
    var userId = req.params.id;
    //use findOne
    for (var i = 0; i < users.length; i++) {
        if (users[i]['id'] === userId) {
            res.status(200).send({'user': users[i]});
        }
    }
});

app.get('/api/logout', function(req, res) {
    req.logout();
    res.status(200).end();
});

app.post('/api/users', function(req, res) {
    users.push(req.body.user);
    req.logIn(user, function(err) {
        if (err) {
            return res.status(500).end();
        }
        return res.send({'users': req.body.user});
    });
});

app.post('/api/posts', ensureAuthenticated, function(req, res) {
    if (req.user.id === req.body.post.user) {
        var post = {
            id: posts.length + 1,
            user: req.body.post.user,
            createdDate: req.body.post.createdDate,
            body: req.body.post.body
        };
    posts.push(post);
    res.send({'post': post});
    }
    else {
        return res.status(403).end();
    }
});





