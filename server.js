
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

var users = [{
        id: 'stevetyler',
        name: 'Steve Tyler',
        password: 'steve',
        imageURL: '/assets/img/users/stevetyler.png',
        operation: 'login'
    }, {
        id: 'vivhoford',
        name: 'Vivien Hoford',
        password: 'vivien',
        imageURL: '/assets/img/users/vivhoford.png',
        operation: 'login'
    }, {
        id: 'rachelblanton',
        name: 'Rachel Blanton',
        password: 'rachel',
        imageURL: '/assets/img/users/rachelblanton.png',
        operation: 'login'
    }];

var posts = [{
        id: 'id1',
        user: 'stevetyler',
        createdDate: new Date(2014, 8, 5),
        body: 'Ember is great!',
    }, {
        id: 'id2',
        user: 'vivhoford',
        createdDate: new Date(2014, 8, 6),
        body: 'What\'s Ember?',

    }, {
        id: 'id3',
        user: 'rachelblanton',
        createdDate: new Date(2014, 8, 8),
        body: 'I have no idea what you\'re talking about',
    }];

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
    function(username, password, done) {
        for (var i = 0; i < users.length; i++) {
            if (users[i]['id'] === username) {
                if (users[i]['password'] === password) {
                    var user = users[i];

                    return done(null, user, null);
                }
                else {
                    return done(null, null, null);  // needs to return or it will keep searching
                }
            }
        }
        return done(null, null, null);
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





