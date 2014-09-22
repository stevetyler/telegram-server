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

function getUser(id) {
  for (var i = 0; i < users.length; i++) {
    if (users[i]['id'] === id) {
        return users[i];
        // need to break ?
    }
}}

getUser('stevetyler');