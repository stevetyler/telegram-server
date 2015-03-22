// crontab -e
// @hourly node /path/to/file/lib/import-favs.js > /path/importer.log 
// 


var db = require('../database/database');

var FavImporter = require("./lib/import-favs.js");

console.log('Starting import fav procedure');

db.once("open", function() {

	// forEach usewr....

  FavImporter.importFavs(user.id);

    // }

});

//process.exit();
