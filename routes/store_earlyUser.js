var mongoose = require('mongoose');
// use the mongoose model in the application
var earlyUser = require('../models/earlyUserModel.js');
var credentials = require('../credentials.js'); // to learn to use sessions
var Q = require('q'); // Get Q to manage asynch calls. Callback hell is no fun!!

var opts = {
	server : {
			 socketOptions:{keepAlive:1}
		 }
};

module.exports=function(req, res, next){
	function invalid (){
		res.render('index', {invalid: true});
	}
	var deferred = Q.defer();
	console.log('inside the logic to save early User...');
	console.log('req.body:'+JSON.stringify(req.body));
	console.log('req.params'+JSON.stringify(req.query));
	var user = {_id: req.body.email,
		    'name': req.body.name,};
	earlyUser.create(user, function(err, newUser){
		if (err){
			if(err instanceof mongoose.Error.ValidationError) {
				deferred.reject(err);
				return invalid();
			}
			return next(err);
		}
		deferred.resolve(newUser);
		console.log("new user added:"+JSON.stringify(newUser));
	});
	return deferred.promise;
}
