
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var nlogger = require('nlogger').logger(module);

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
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function(username, password, done) {
        for (var i = 0; i < users.length; i++) {
            if (users[i]['id'] === username) {
                if (users[i]['password'] === password) {
                    return done(null, user, null);
                }
                // is this necessary?
                else {
                    return done(null, null, null);
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
            return done(null, user);
        }
    }
    return done(null, null);
});

// REST adapter makes request
app.get('/api/users', function(req, res) {
    var operation = req.query.operation;
    var user;

    if (operation === 'login') {
        passport.authenticate('local', function(err, user, info) {
            if (err) {
                // sends status only.
                return res.status(500).end();
            }
            if (!user) {
                return res.status(404).end();
            }
            // sets cookie req.logIn
            req.logIn(user, function(err) {
                if (err) {
                    return res.status(500).end();
                }
                // res.send always sets status 200
                return res.send([user]);
            });
        })(req, res);
    }
    else {
        res.status(200).send({'users': users});
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

app.post('/api/users', function(req, res) {
   users.push(req.body.user);
   res.send({'user': req.body.user});
});

app.post('/api/posts', function(req, res) {
    var post = {
        id: posts.length + 1,
        user: req.body.post.user,
        createdDate: req.body.post.createdDate,
        body: req.body.post.body
    };
    // console.log(post);
    posts.push(post);
    res.send({'post': post});
});





