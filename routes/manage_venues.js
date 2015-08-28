var mongoose = require('mongoose');
// use the mongoose model in the application
var Venue = require('../models/venue_result.js');
var Images = require('../models/image_model.js');

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
		// req.body.venuename is the new venue on Manage Venues Profile page
		// req.body.venues is the dropdown select on Manage Venues Profile page
		console.log('req.body:'+JSON.stringify(req.body));
		var query = {};
		var venue ={};
		if (req.body.venues =="add"){
			query = {_id: req.body.venuename};
			venue._id = req.body.venuename;
		}else {
			query = {_id: req.body.venues};
			venue._id = req.body.venues;
		}
		var options = {upsert: true};
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
		venue.address.city = req.body.city;
		venue.address.state = req.body.state;
		venue.address.zip = req.body.zip;
		venue.ameneties.wifi = req.body.wifi || false;
		venue.ameneties.coffee = req.body.coffee || false;
		venue.ameneties.posteventcleaning = req.body.posteventcleaning || false;
		venue.detaildescription = req.body.venuedetail;
		venue.hourlyrate = Number(req.body.hourlyrate);
		venue.calendarID = req.body.gcalendars;
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

function addImagesToVenues(imageArray, venueId){
	var deferred = Q.defer();
	var query = {_id: venueId};
	var venue = {};
	var options = {upsert: true};
	var image='';
	imageArray.forEach(function(imagefile){
		image = new Images({name:imagefile.key, imagelocation: 'https://s3.amazonaws.com/meetsites-images/'}); 
		image.save(function(err, image){
			if (err) throw err;
			Venue.findOneAndUpdate(query, {"$push": {"pictures": image._id}}, function(err, numAffected){
				console.log('saved to the db');
			});
		});
	})
}

function fetchVenues(req, res, next){
	var deferred = Q.defer();
	// if (req.session.isLoggedIn){
		// build the query using the parameters passed from the search box
		// if nothing is passed, just grab everything and pass it on
	console.log('req body in fetchVenues --->:'+JSON.stringify(req.body));
	console.log('req.query venuename?:'+JSON.stringify(req.query._id));
	var myQuery = Venue.find({});
	
	// if a specific venue was searched from the search form on the browse page`
	if(req.body.venuename ){
		myQuery = myQuery.where('_id').equals(req.body.venuename);
	}

	// the venue name field is called venues on the venue manager form on Host Profile settings page
	if(req.query.venuename){
		console.log(req.query.venuename+' is the venue we got');
		myQuery = myQuery.where('_id').equals(req.query.venuename);
	}

	// if coming in from host detail page, get only that specific venue
	if(req.path == '/host_detail'){
		console.log('adding '+req.query._id+'to the query');
		myQuery = myQuery.where('_id').equals(req.query._id);
	}
	if(req.session.user && (!(req.path.indexOf('browse')>-1))){
		console.log('adding user to the query:'+req.session.user);
		myQuery = myQuery.where('host_email').equals(req.session.user);
	}
	// if a Zip or City or State was entered, add that to the query - utilizing the fact that req.body is only available from Search page.
	if (req.body.where){
		console.log('adding the or class for address zip, city or state');
		myQuery.or([{'address.zip': req.body.where}, {'address.city': req.body.where}, {'address.state': req.body.where}]);
//		myQuery = myQuery.where('address.city').equals(req.body.where);
	}
	var selectcols = '_id host_email address uses ameneties pictures detaildescription hourlyrate calendarID';
	myQuery.select(selectcols);
	//Venue.paginate(myQuery, function(error, pageCount,paginatedResults, itemCount){
	Venue.paginate(myQuery, { page: req.query.page, limit: 5, columns: selectcols, populate: 'pictures'}, function(error, paginatedResults, pageCount, itemCount){
		if (error){
			console.error('error ho gaya...');
			deferred.reject(error);
		}else {
			console.log('pages:'+pageCount);
			console.log('results:'+paginatedResults);
			// it is here that I want to insert a function to call googleAPI to check for availability
			deferred.resolve({result:paginatedResults,pageCount:pageCount,itemCount:itemCount});
		}
	} );
	return deferred.promise;
}
exports.checkIfExists= check_if_exists;
exports.storeVenue = storeVenue;
exports.fetchVenues = fetchVenues;
exports.addImagesToVenues = addImagesToVenues;
