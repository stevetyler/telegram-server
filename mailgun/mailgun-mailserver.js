// implement config.js that's required by database


var Mailgun = require('mailgun-js');

var api_key = 'key-7932438a6fbbbe7ced17e09c849ad26f';
var domain = 'sandboxefab4ad740d044ac9681ee7f2a19e813.mailgun.org';

var myMailgun = new Mailgun({
  apiKey: api_key, domain: domain
});

var data = {
  from: 'Telegram <telegram@mailgun.org>',
  to: '',
  subject: 'Password Reset',
  text: 'Your new password is'
};