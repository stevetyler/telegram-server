var db = require('../database/database');

var Twitter = require('twitter');
var configAuth = require('../auth');

var User = db.model('User');
var Post = db.model('Post');


module.exports.importFavs = function(userId) {

  // find users with access tokens only
  User.where("twitterAccessToken").ne(null).find(function (err, users) {
    if (err) {
      return console.error(err);
    }

    users.forEach(function(user) {
      console.log('Importing favs for user' + user.name);
      var client = new Twitter({
        consumer_key: configAuth.twitterAuth.consumerKey,
        consumer_secret: configAuth.twitterAuth.consumerSecret,
        access_token_key: user.twitterAccessToken,
        access_token_secret: user.twitterSecretToken
      });

      var params = {
        screen_name: user.id,
        count: 10
      };

      // if (req.user.twitterLastTweetId) {
      //   params.since_id = req.user.twitterLastTweetId;
      // }


      client.get('favorites/list', params, function(error, tweets, response) {
        var tweetArr = [];

        if (error) {
          console.log(error);
        }
        // console.log(tweets[0]);  // The favorites.
        // console.log(response);  // Raw response object.
        // create post from tweets array and store twitterLastTweetId for user depending on order received

        // put fav tweets in arr using foreach loop
        tweets.forEach(function(tweet) {
          twitterPost = {
            body: tweet.text,
            createdDate: tweet.created_at,
            user: user.id,
            twitterTweetId: tweet.id // loop through tweets
          };
          tweetArr.push(twitterPost);
        });

        // call create function of post model to create posts
        // eg check connection.model('Post')
        tweetArr.forEach(function(tweet) {
          var newPost = new Post(tweet);

          // find post where twitterId exists else save
          newPost.save(function(err, tweet) {
            if (err) {
              console.log('Error saving fav' + err);
            }
            console.log('Saved fav successfully');
            // return res.send({'posts': tweetArr});
          });
        });
        // callback update twitterLastTweetId
      });
    });
  });
};


