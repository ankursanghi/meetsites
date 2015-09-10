var venueManager = require('./routes/manage_venues.js');
var mediaManager = require('./routes/manage_media.js');
var searchManager = require('./routes/manage_search.js');
var googleCalendar = require('./googleapi.js');
module.exports = function(app){
	app.get('/venues', function(req, res, next){
//		console.log('inside the venues fetch...');
		venueManager.fetchVenues(req, res, next).then(function(venuesResult){
			var resultObj = venuesResult.result;
			var returnObj =[];
			// the same api returns the JSON for venue detail if req.query.venuename is populated
			// fetchVenues function already looks at the req.query.venuename and fetches details of the specified venue
			if (req.query.venuename){
				res.json(resultObj);
			}else{
				resultObj.forEach(function(elem, idx){
					returnObj.push({"venueName":elem.name});	
				});
				res.json(returnObj);
			}
		});
	});
	// get the calendars for this user
	app.get('/gCalendars', function(req,res, next){
		console.log('inside the gCalendars fetch...');
		googleCalendar.getCalendarList(req,res,next);
	});
	// get the details of a particular calendar
	app.get('/getEvents/:calId', function(req, res, next){
		console.log('inside getEvents with param:'+req.param.calId);
	});
}
