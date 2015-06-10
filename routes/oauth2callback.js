var mongoose = require('mongoose');
// use the mongoose model in the application
var User = require('../models/test1.js');
var credentials = require('../credentials.js'); // to learn to use sessions
var crypto = require('crypto');
var hash = require('../helpers/hash.js');
var signupGoogle = require('../login_page.js');

var opts = {
	server : {
			 socketOptions:{keepAlive:1}
		 }
};

module.exports=function(app, token){
	switch(app.get('env')){ 
		case 'development':
			mongoose.connect(credentials.mongo.development.connectionString, opts);
			break;
		case 'production':
			mongoose.connect(credentials.mongo.production.connectionString, opts, function(err){
				if (err){ console.log("Hey! MongoDB connection failed");} else {
					console.log("Hey! MongoDB connection successful!");}
			});
			break;
		default:
			throw new Error('Unknown execution environment: ' + app.get('env'));
	};
	// Login page here
	app.get('/oauth2callback', function(req, res){ 
		// this URL is called when Google oAuth2 returns with an auth code, and auth code 
		// needs to be exchanged for tokens
		// these tokens then need to be saved in the database along with the user details
		if (req.session.isLoggedIn){
			console.log('inside the logic to save access and refresh tokens');
			var query = {_id: req.session.user};
			var user ={};
			var options = {upsert: true};
			user.token = token;
			User.findOneAndUpdate(query, user, options, function(err, doc){
				if (err){
					console.log("received an error while updating the user with tokens");
					return next(err);
				}
			});
		}
	});

}
