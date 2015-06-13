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

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
// function authorize(credentials, callback) {
function authorize(credentials) {
	var deferred = Q.defer();
	var clientSecret = credentials.installed.client_secret;
	var clientId = credentials.installed.client_id;
	var redirectUrl = credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, function(err, token) {
		if (err) {
			deferred.reject();
			presentNewTokenSignup(oauth2Client, res);

		} else {
			oauth2Client.credentials = JSON.parse(token);
			deferred.resolve(oauth2Client);
		}
	});
	return deferred.promise;
}
/* New function to determine if this user has previously authorized MeetSites
   For now, assume that if a token is stored, it is authorized
   If the token is not stored, it is not authorized.
   For later improvement, handle the case when customer has revoked permissions for MeetSites
*/
function isPreviouslyAuth(credentials){
	var deferred = Q.defer();
	var clientSecret = credentials.installed.client_secret;
	var clientId = credentials.installed.client_id;
	var redirectUrl = credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	// Check if we have previously stored a token.
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function presentNewTokenSignup(res) {
	fs.readFile('client_secret_oAuth.json', function processClientSecrets(err, data) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			return;
		}
		var credentials = JSON.parse(data);
		var clientSecret = credentials.web.client_secret;
		var clientId = credentials.web.client_id;
		var redirectUrl = credentials.web.redirect_uris[0];
		var auth = new googleAuth();
		var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

		var authUrl = oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES
		});
		console.log('Authorize this app by visiting this url: ', authUrl);
		res.writeHead(301, {Location: authUrl});
		res.end();
	});
}

// the code is returned by the oauth2callback URL
// this function creates a new oauth2client, uses the code passed to it
// then, exchanges it for tokens using getToken call
function getNewToken(code) {
	var deferred = Q.defer(); // get a new deferral
	fs.readFile('client_secret_oAuth.json', function processClientSecrets(err, data) {
		if (err) {
			console.log('Error loading client secret file: ' + err);
			deferred.reject(err);
			return;
		}
		var credentials = JSON.parse(data);
		var clientSecret = credentials.web.client_secret;
		var clientId = credentials.web.client_id;
		var redirectUrl = credentials.web.redirect_uris[0];
		var auth = new googleAuth();
		var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

		oauth2Client.getToken(code, function(err, token) {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
				deferred.reject(err);
				return;
			}
			oauth2Client.credentials = token;
			deferred.resolve(token);
			console.log('token response'+JSON.stringify(token));
			// storeToken(token);

		});
	});
	return deferred.promise;
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

function getTokenURL(oauth2Client, res){
	var deferred = Q.defer();

	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
	    scope: SCOPES
	});

}
exports.presentNewTokenSignup= presentNewTokenSignup;
exports.getNewToken = getNewToken;
