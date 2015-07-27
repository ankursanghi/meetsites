var mongoose = require('mongoose');
// use the mongoose model in the application
var Venue = require('../models/venue_result.js');

var credentials = require('../credentials.js'); // to learn to use sessions
var Q = require('q'); // Get Q to manage asynch calls. Callback hell is no fun!!

var opts = {
	server : {
			 socketOptions:{keepAlive:1}
		 }
};
function check_if_exists(req, res, next){
	function invalid (){
		res.render('index', {invalid: true});
	}
	var deferred = Q.defer();
	console.log('inside the logic to check if venue exists...');
	console.log('req.body:'+JSON.stringify(req.body));
	console.log('req.params'+JSON.stringify(req.query));
	Venue.findOne({host_email: req.session.user}, function(err, venue){
		if(err){
			// here the venue wasn't found, show the page to enter details of the venue
			console.log("Not found venue:err:"+err.stack);
			deferred.reject(err);
		}
		if(!venue){
			console.log("Null found!");
			deferred.reject(new Error("Venue not set-up for user"));
		}else{
			console.log("found the venue:"+JSON.stringify(venue));
			deferred.resolve(venue);
		}
	});
	return deferred.promise;
}

function storeVenue(req,res,next){
	var deferred = Q.defer();
	if (req.session.isLoggedIn){
		var query = {_id: req.body.venuename};
		var venue ={};
		var options = {upsert: true};
		console.log('req.body:'+JSON.stringify(req.body));
		venue._id = req.body.venuename;
		venue.host_email = req.session.user;
		venue.uses = {};
		venue.ameneties = {};
		venue.address = {};
		venue.uses.kids = false;
		if (req.body.use4kids){
			venue.uses.kids = req.body.use4kids;
		}
		venue.uses.party = req.body.use4party || false;
		venue.uses.corporate = req.body.use4corp || false;
		venue.address.line1 = req.body.addressline1;
		venue.address.line2 = req.body.addressline2;
		venue.ameneties.wifi = req.body.wifi || false;
		venue.ameneties.coffee = req.body.coffee || false;
		venue.ameneties.posteventcleaning = req.body.posteventcleaning || false;
		Venue.findOneAndUpdate(query, venue , options, function(err, doc){
			if (err){
				console.log("received an error while updating/inserting the venue"+err);
				deferred.reject(err);
				return next(err);
			}
			console.log('Saved the venue to the DB');
			deferred.resolve(doc);
		});
	}
	return deferred.promise;
}

function fetchVenues(req, res, next){
	var deferred = Q.defer();
	// if (req.session.isLoggedIn){
		// build the query using the parameters passed from the search box
		// if nothing is passed, just grab everything and pass it on
	var myQuery = Venue.find({});
	if(req.body.venuename){
		myQuery.where('_id').equals(req.body.venuename);
	}
	myQuery.select('_id address uses ameneties'); // this will have to change to accommodate pictures
	//Venue.paginate(myQuery, function(error, pageCount,paginatedResults, itemCount){
	console.log('here to fetch venues...');
	Venue.paginate({}, { page: req.query.page, limit: 5, columns: '_id address uses ameneties'}, function(error, paginatedResults, pageCount, itemCount){
		if (error){
			console.error('error ho gaya...');
			deferred.reject(error);
		}else {
			console.log('pages:'+pageCount);
			deferred.resolve({result:paginatedResults,pageCount:pageCount,itemCount:itemCount});
		}
	} );
//	myQuery.exec(function(err, venues){
//		if (err){
//			deferred.reject(err);
//		}else {
//			console.log("Venues: "+venues);
//			deferred.resolve(venues);
//		}
//	});
	//}

	return deferred.promise;
}
exports.checkIfExists= check_if_exists;
exports.storeVenue = storeVenue;
exports.fetchVenues = fetchVenues;
