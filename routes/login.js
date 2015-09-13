var mongoose = require('mongoose');
// use the mongoose model in the application
var User = require('../models/userModel.js');
var credentials = require('../credentials.js'); // to learn to use sessions
var crypto = require('crypto');
var hash = require('../helpers/hash.js');
var venueManager = require('./manage_venues.js');

var opts = {
	server : {
			 socketOptions:{keepAlive:1}
		 }
};

module.exports=function(app, checkIfVenueExists){
	app.get('/logout', function(req, res,next){
		delete req.session.user;
		delete req.session.name;
		req.session.isLoggedIn = false;
		delete req.session.isLoggedIn;
		req.session.destroy();
		res.render('index', {layout:false});
	});
	// Login page here
	app.get('/login', function(req, res, next){ 
		// Call a function to get redirect URL to authorize user's Google credentials
		//	googleCalendar.getRedirURL(res).then(function(url){
		// Use the 301 redirect to send to the authorization URL
		// This authorization URL already has a redirect URL passed into it
		// Google auth URL redirects back to it.
		console.log("On the login page...");
		if (req.session.isLoggedIn) {
			res.render('hostprofile', {name:req.session.name, layout: false});
		}else{
			res.render('login_form');
		}
		// present the new Token sign up page on app.post
		// login_logic.presentNewTokenSignup(res);
	});

	// venue details and ameneties - update
	app.get('/hostDetail_settings', function(req, res, next){
		if (req.session.isLoggedIn){
			venueManager.fetchVenues(req, res, next).then(function(venueResult){
				res.render('hostDetail_settings', {name:req.session.name, 
				       				   layout: false});
			});
		}else{
			res.render('login_form');
		}
	});

	app.post('/hostDetail_settings', function(req, res, next){
		if (req.session.isLoggedIn){
			venueManager.storeVenue(req,res,next).then(function(doc){
				console.log('saved the venue here:'+JSON.stringify(doc));
				res.render('hostDetail_settings', {name: req.session.name, updatesuccess: true, layout: false});
			});
		}else{
			res.render('login_form');
		}
	});
	//create a new account
	app.post('/login', function(req,res,next){
		var email = req.body.email;
		var passwd = req.body.pwd;
		var salt;
		var checkHash;
		function invalid (){
			res.render('login_form', {invalid: true});
		}
		console.log("email:"+email);
		if (!(email && passwd)) return invalid();
		// TODO: Fetch the user salt from MongoDB so we can hash the password entered and compare with the hashed password stored in the database
		User.findOne({_id: email}, function(err, user){
			if(err){
				return invalid();
			}
			if(!user){
				return invalid();
			}else{
				salt=user.salt;
				checkHash = hash(passwd, user.salt);
				if(checkHash == user.hash){
					console.log("checkHash: "+checkHash);
					console.log("use.hash: "+user.hash);
					req.session.isLoggedIn = true;
					req.session.user = email;
					req.session.name = user.name.first+' '+user.name.last;
					checkIfVenueExists(req,res,next).then(function(venue){
//						res.writeHead(301, {Location: '/hostprofile'});
						res.render('hostprofile', {name:req.session.name, layout: false});
					}, function(err){
						console.log('error from checkIfExists'+err);
						res.writeHead(301, {Location: '/hostDetail_settings'});
						res.end();
					});
//					res.writeHead(301, {Location: '/dashboard'});
//					res.end();
				}
			}
		});
	});
}
