var mongoose = require('mongoose');
// use the mongoose model in the application
var User = require('../models/userModel.js');
var credentials = require('../credentials.js'); // to learn to use sessions
var crypto = require('crypto');
var hash = require('../helpers/hash.js');
var signupGoogle = require('../signupGoogle.js');
var Q = require('q'); // Get Q to manage asynch calls. Callback hell is no fun!!

var opts = {
	server : {
			 socketOptions:{keepAlive:1}
		 }
};

module.exports=function(req, res, connectString){
	var deferred = Q.defer();
//	mongoose.connect(connectString, opts);
	// Login page here
	// this URL is called when Google oAuth2 returns with an auth code, and auth code 
	// needs to be exchanged for tokens
	// these tokens then need to be saved in the database along with the user details

	// call the oauth2callback to process the oauth2callback auth code and getting tokens
	console.log('auth code is: '+req.query.code);
	signupGoogle.getNewToken(req.query.code).then(function(token){
		if (req.session.isLoggedIn){
			console.log('inside the logic to save access and refresh tokens');
			var query = {_id: req.session.user};
			var user ={};
			var options = {upsert: true};
			user.token = token;
			User.findOneAndUpdate(query, user, options, function(err, doc){
				if (err){
					console.log("received an error while updating the user with tokens");
					deferred.reject(err);
					return next(err);
				}
				console.log('Saved the token to the DB');
				deferred.resolve(doc);
//					res.render('home');
			});
		}
	},function(err){
		console.log("error inside storeToken");
		return next(err);
	}
	);
	return deferred.promise;
}
