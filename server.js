var express = require('express');
var app = express();

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

var users = [{
        id: 'stevetyler',
        name: 'Steve Tyler',
        password: 'steve',
        imageURL: '/assets/img/users/stevetyler.png'
    }, {
        id: 'vivhoford',
        name: 'Vivien Hoford',
        password: 'vivien',
        imageURL: '/assets/img/users/vivhoford.png'
    }, {
        id: 'rachelblanton',
        name: 'Rachel Blanton',
        password: 'rachel',
        imageURL: '/assets/img/users/rachelblanton.png'
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
  res.send({'users': users});
});

app.get('/api/users/:id', function(req, res) {
            
    var userId = req.params.id;
    for (var i = 0; i < users.length; i++) {
        if (users[i]['id'] === userId) {

            res.send({'user': userId});
        }
    }

});


