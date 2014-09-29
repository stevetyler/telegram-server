var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());

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
    
// Route implementation
app.get('/api/users', function(req, res) {
    var operation = req.query.operation;
    var username = req.query.username;
    var password = req.query.password;
    var user;

    if (operation === 'login') {

        // search user and check password matches, then send back array that only contains that user to client.
        for (var i = 0; i < users.length; i++) {
            if (users[i]['id'] === username) {
                user = users[i];
            }
        }
        if (password === user.password) {
            console.log(user.password);
            console.log(password);
            res.status(200).send({'users': [user]});
        }
        else {
            res.status(200).send({'users': []});
        }
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
    console.log(post);
    posts.push(post);
    res.send({'post': post});
});





