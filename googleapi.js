// Mongoose to connect to the noSQL DB for user login
// remember that the connect string is passed to the functions in this module based on env variable NODE_ENV
var mongoose = require('mongoose');
// use the mongoose model in the application
var User = require('./models/userModel.js');
var async = require('async');

var signupGoogle = require('./signupGoogle.js');
var fs = require('fs');
var Q = require('q'); // Get Q to manage asynch calls. Callback hell is no fun!!
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var calendar = google.calendar('v3');

var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
		process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-api-quickstart.json';

var opts = {
	server : {
			 socketOptions:{keepAlive:1}
		 }
};
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
// function authorize(credentials, callback) {
function authorize(credentials, req, res, connectString) {
	var deferred = Q.defer();
	var clientSecret = credentials.web.client_secret;
	var clientId = credentials.web.client_id;
	var redirectUrl = credentials.web.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	// Check if we have previously stored a token.
	// TODO - this file read needs to be replaced with a mongo query
//	fs.readFile(TOKEN_PATH, function(err, token) {
	if (req.session.isLoggedIn){
		var query = User.findOne({_id : req.session.user});
		query.select('token');
		query.exec(function (err, doc){
			if (err) {
				deferred.reject();
				signupGoogle.presentNewTokenSignup(oauth2Client, res);
			} else {
//				oauth2Client.credentials = JSON.parse(token);
				console.log('token retrieved from db:'+doc.token);
				oauth2Client.credentials = doc.token;
				deferred.resolve(oauth2Client);
			}
		});
	}
	return deferred.promise;
}

function authorizeRegular (credentials,token) {
	var deferred = Q.defer();
	var clientSecret = credentials.web.client_secret;
	var clientId = credentials.web.client_id;
	var redirectUrl = credentials.web.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
	
	console.log('token retrieved from param:'+token);
	if (token=="") deferred.reject("no token");
	oauth2Client.credentials = token;
	deferred.resolve(oauth2Client);
	return deferred.promise;
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
// function getNewToken(oauth2Client, callback) {
function getNewToken(oauth2Client) {
	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
	    scope: SCOPES
	});
	console.log('Authorize this app by visiting this url: ', authUrl);
	var rl = readline.createInterface({
		input: process.stdin,
	    output: process.stdout
	});
	rl.question('Enter the code from that page here: ', function(code) {
		rl.close();
		oauth2Client.getToken(code, function(err, token) {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
				return;
			}
			oauth2Client.credentials = token;
			storeToken(token);
//			callback(oauth2Client);

		});
	});
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
	try {
		fs.mkdirSync(TOKEN_DIR);
	} catch (err) {
		if (err.code != 'EEXIST') {
			throw err;
		}
	}
	fs.writeFile(TOKEN_PATH, JSON.stringify(token));
	console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Gets the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getEvents(auth) {
	var deferred = Q.defer(); // get a new deferral
	calendar.events.list({
		auth: auth,
		calendarId: 'primary',
		timeMin: (new Date()).toISOString(),
		maxResults: 5,
		singleEvents: true,
		orderBy: 'startTime'
		}, function(err, response) {
			if (err) {
				console.log('There was an error contacting the Calendar service: ' + err);
				console.log('Response from the Calendar service: ' + response);
				deferred.reject(); // deferred reject here
				return;
			}
			var events = response.items;
			if (events.length == 0) {
				console.log('No upcoming events found.');
				deferred.reject(); // deferred reject here
			} else {
				deferred.resolve(response); // deferred resolve here
//				console.log('JSON for events:'+JSON.stringify(events));
//				console.log('Upcoming 10 events:');
//				for (var i = 0; i < events.length; i++) {
//					var event = events[i];
//					var start = event.start.dateTime || event.start.date;
//					console.log('%s - %s', start, event.summary);
//				}
			}
		});
	return deferred.promise; // return a promise
}
// this function is the one exported
// it gets the request object, response object, and the mongoDB connect string
// and returns the response of Google Calendar API call to get Events on the calendar.
function getCalEvents(req, res, connectString) {
	// Load client secrets from a local file.
	var deferred = Q.defer();
	fs.readFile('client_secret_oAuth.json', function processClientSecrets(err, content) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			deferred.reject(err);
			return;
		}
		// Authorize a client with the loaded credentials, then call the Calendar API.

//		authorize(JSON.parse(content)).then(getEvents(oauth2Client)).then(console.log('I got my response here:'+JSON.stringify(events)));
		authorize(JSON.parse(content), req, res, connectString).then(
			function(oauth2Client) { 
				getEvents(oauth2Client).then(
				function(response){
//					console.log('the events are stringified here:'+JSON.stringify(response.items));
					deferred.resolve(response);
				})
			});
	});
	return deferred.promise;
}


// this function will check availability on the primary calendar
function getAvail(auth, dateTimeRange, calID) {
	console.log('auth:'+JSON.stringify(auth));
	console.log('date Time Range :'+(dateTimeRange.start).toISOString()+' --->'+(dateTimeRange.end).toISOString());
	console.log('calendar id to check freebusy:'+calID);
	var deferred = Q.defer(); // get a new deferral
	calendar.freebusy.query({
		auth: auth,
		headers: { "content-type" : "application/json" },
		resource:{items: [{"id" : calID}],
			  timeMin: (dateTimeRange.start).toISOString(),
			  timeMax: (dateTimeRange.end).toISOString()
			}
	}, function(err, response) {
//			console.log('Response from the Calendar service: ' + JSON.stringify(response));
			if (err) {
				console.log('There was an error contacting the Calendar service: ' + err);
				deferred.reject(); // deferred reject here
				return;
			}
			var events = response.calendars[calID].busy;
			if (events.length == 0) {
				console.log('No upcoming events found.');
			} else {
				console.log('busy in here...');
			}
			deferred.resolve(response); // deferred resolve here
		});
	return deferred.promise; // return a promise
}

function getGCalendarList(auth, callback){
	calendar.calendarList.list({
		auth: auth
	}, function(err, response){
		if (err) {
			console.log('There was an error contacting the Calendar service: ' + err);
			return;
		}
		var itemList = response.items;
		callback(itemList);
	});
}
function checkAvailFunc (clientSecret, token, dateTimeRange, venue) {
	// Load client secrets from a local file.
	// Authorize a client with the loaded credentials, then call the Calendar API.
	console.log('checkAvailFunc called with\n');
	console.log('dateTimeRange:'+JSON.stringify(dateTimeRange));
	console.log('Calendar ID:'+venue.calendarID);
	authorizeRegular(clientSecret, token).then(
		function(oauth2Client) { 
			getAvail(oauth2Client, dateTimeRange, venue.calendarID).then(
			function(response){
				console.log('Response from the Calendar service: ' + JSON.stringify(response));
				if (response.calendars[venue.calendarID].busy.length > 0){
					venue.available = false;
				}else {
					venue.available = true;
				}
				return response;	
			}, function(err){
				console.log('error inside checkAvailFunc...');
			})
		}, function (err){
			console.log('error inside checkAvailFunc from authorizeRegular');
		});
}
// given a list of venue results and a check availability function, this will return an array of anonymous functions
// that could do this availability check with google

function getToken(email){
	var deferred = Q.defer();

	User.findById(email, function(err, doc){
		if (err) deferred.reject(err);
		deferred.resolve(doc.token);
	});
	return deferred.promise;
}

function createFunc (clientSecret, token, dateTimeRange, venue){

	var temp_func = function(callback){
		var tempRes = checkAvailFunc(clientSecret, token, dateTimeRange, venue); // this is an asynchronous call
		console.log('Response after the Calendar service: ' + JSON.stringify(venue));
		callback(null, tempRes);
	}
	return temp_func;
}

function asyncIteratorFunc (venue, cb){
	fs.readFile('client_secret_oAuth.json', function processClientSecrets(err, content) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			deferred.reject(err);
			return;
		}
		var clientSecret = JSON.parse(content);
		getToken(venue.host_email).then(function(token){
			console.log('dateTimeRange:'+JSON.stringify(venue.dateTimeRange));
			console.log('Calendar ID:'+venue.calendarID);
			authorizeRegular(clientSecret, token).then(function(oauth2Client) { 
				getAvail(oauth2Client, venue.dateTimeRange, venue.calendarID).then(function(response){
						console.log('Response from the Calendar service: ' + JSON.stringify(response));
						if (response.calendars[venue.calendarID].busy.length > 0){
							console.log(' ==========> making it false for '+response.calendars[venue.calendarID].busy);
							venue.available = false;
						}else {
							console.log(' ==========> making it true for '+response.calendars[venue.calendarID].busy);
							venue.available = true;
						}
						// return cb(null, response.calendars[venue.calendarID].busy.length);
						 return cb(null, venue);
					}, function(err){
						console.log('error inside checkAvailFunc...');
					});
				}, function (err){
					console.log('error inside authorizeRegular');
				}
			);
		});
	});
}

function makeArrayOfFunctions(venueList, dateTimeRange, nextFunc){
	var funcArray=[];
	var temp_func;
	var numVenues = venueList.length;
	console.log('logging inside makeArrayOfFunctions...');
	if (numVenues === 0) return funcArray;

	fs.readFile('client_secret_oAuth.json', function processClientSecrets(err, content) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			deferred.reject(err);
			return;
		}
		var clientSecret = JSON.parse(content);
		async.map(venueList, function(venue, next){
//			console.log('each venue:'+JSON.stringify(venue._id));
			getToken(venue.host_email).then(function(token){
				// the function to call checkAvailFunc is done in a function to protect scope for the venue 
				// if an anonymous function was created here, all function copies will reference the same (the last one) venue.
				temp_func = createFunc(clientSecret, token, dateTimeRange, venue); 
				funcArray.push(temp_func);
				// call the callback once the number of venues has reached to last
				if(--numVenues === 0) {
					nextFunc(funcArray);
				}
			});
			next();
		}, function(err){ // this is called if an error happens or when the async.forEach loop finishes.
			          // it couldn't have the nextFunc call because the funcArray is not available outside 
			console.log('iterating done');
		});
	});
}

function getCalendarList(req, res, next){
	if (req.session.isLoggedIn){
		fs.readFile('client_secret_oAuth.json', function processClientSecrets(err, content) {
			if (err) {
				console.log('Error loading client secret file: ' + err);
				deferred.reject(err);
				return;
			}
			var clientSecret = JSON.parse(content);
			// user email is in req.session.user				
			getToken(req.session.user).then(function(token){
				authorizeRegular(clientSecret, token).then(function(oauth2Client) { 
					getGCalendarList(oauth2Client,function(calendarList){
						console.log('getting here before res.json...'+calendarList);
						res.json(calendarList);
					});
				});
			});
		});
	} else{
		next();
	}	
}
//getCalEvents();
exports.getCalEvents = getCalEvents;
exports.checkAvailFunc = checkAvailFunc; // TBD - is this function really called anywhere?
exports.makeArrayOfFunctions = makeArrayOfFunctions;
exports.getCalendarList= getCalendarList;
exports.asyncIteratorFunc = asyncIteratorFunc ;
