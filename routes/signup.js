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

User.find(function(err, users){
	if (users.length) return;

	new User({
		_id: 'ankursanghi',
	    passwd: 'anks0521',
	    access_token: 'testing123testing123',
	    refresh_token: '123testing123testing',
	}).save();

	new User({
		_id: 'monikasanghi',
	    passwd: 'mons0917',
	    access_token: 'testing123testing123',
	    refresh_token: '123testing123testing',
	}).save();
});
module.exports=function(app){
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
	app.get('/login', function(req, res){ 
		// Call a function to get redirect URL to authorize user's Google credentials
		//	googleCalendar.getRedirURL(res).then(function(url){
		// Use the 301 redirect to send to the authorization URL
		// This authorization URL already has a redirect URL passed into it
		// Google auth URL redirects back to it.
		console.log("On the login page...");
		res.render('login_form');
		// present the new Token sign up page on app.post
		// login_logic.presentNewTokenSignup(res);
	});

	//create a new account
	app.post('/login', function(req,res,next){
		var firstName = req.body.firstname;
		var lastName = req.body.lastname;
		var email = req.body.email;
		var passwd = req.body.pwd;
		function invalid (){
			res.render('login_form', {invalid: true});
		}
		console.log("name:"+firstName+" "+lastName+" "+email);
		if (!(email && passwd)) return invalid();
		// TODO: add logic to check if this user already exists, and show login page instead of sign-up page with an alert that the user may have forgotten pwd
		crypto.randomBytes(16, function(err, bytes){
			if (err) return next(err);
			var user = {_id: email};
			user.salt = bytes.toString('utf8');
			user.hash = hash(passwd, user.salt);
			User.create(user, function(err, newUser){
				if (err){
					if(err instanceof mongoose.Error.ValidationError) {
						return invalid();
					}
					return next(err);
				}
			});
			req.session.isLoggedIn = true;
			req.session.user = email;
			console.log('created user: %s',email);
			return signupGoogle.presentNewTokenSignup(res);
		});
	});
}