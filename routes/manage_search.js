var venueManager = require('./manage_venues.js');
var googleCalendar = require('../googleapi.js');
var async = require('async');

module.exports = function(app){
	app.get('/browse', function(req,res, next){
		venueManager.fetchVenues(req, res, next).then(function(venuesResult){
			var tempString='';
			// limit the description to 140 characters and then add ellipsis
			for (var i=0; i<venuesResult.result.length; i++){
				if (venuesResult.result[i].detaildescription){
					if (venuesResult.result[i].detaildescription.length > 140){
						tempString = venuesResult.result[i].detaildescription.substring(0,140)+'...';
						venuesResult.result[i].detaildescription = tempString;
					}else{
						tempString = venuesResult.result[i].detaildescription.substring(0,140);
						venuesResult.result[i].detaildescription = tempString;
					}
				}
				tempString='';
			}
			if (req.session.searchWhenStart){
				console.log('session for search is  set...');
				var countSkip=0;
				var dateTimeRange = {};
				var startDateTimeJS = new Date(req.session.searchWhenStart);
				console.log('start date time js in search session ...'+startDateTimeJS);
				dateTimeRange.start = startDateTimeJS;
				var endDateTimeJS= new Date(req.session.searchWhenStart);
				endDateTimeJS.setTime(startDateTimeJS.getTime()+req.session.searchDuration*60*60*1000);
				dateTimeRange.end = endDateTimeJS;
				console.log('free busy end date time in search session:'+dateTimeRange.end);

				for (var i=0; i<venuesResult.result.length; i++){
					venuesResult.result[i].dateTimeRange = dateTimeRange;
				}
				var asyncIterator = googleCalendar.asyncIteratorFunc;
				async.map(venuesResult.result,asyncIterator, function (err, results){
	//				console.log('results after iterator call:'+results);
					for (var k=results.length-1; k>=0; k -= 1){ // a reverse loop is needed because splice re-indexes the array from current point to end of array.
						if (!(results[k].available)){
							countSkip++;
							results.splice(k,1);
						}
					}
					res.locals.partials.venues = results;
					var perPageLimit = 5;
					var pageSkipped = Math.floor(countSkip / perPageLimit) || 0;
					res.render('search_result', {search_obj: {pagination: {page:req.query.page-pageSkipped || 1, limit:perPageLimit, totalRows:venuesResult.itemCount-countSkip} },
									where: req.session.searchWhere,
									whenstart: String(req.session.searchWhenStart),
									duration: req.session.searchDuration,
									layout: false,
					});
				});	
			}else{
				console.log('plain get without search session');
				var perPageLimit = 5;
				res.locals.partials.venues = venuesResult.result;
				res.render('search_result', {search_obj: {pagination: {page:req.query.page || 1, limit:perPageLimit, totalRows:venuesResult.itemCount} },
								layout: false,
								name: req.session.name,
				});
			}
		});
	});

	app.post('/browse', function(req,res, next){
		req.session.searchWhere = req.body.where;
		req.session.searchWhenStart = req.body.whenstart;
		req.session.searchDuration = req.body.duration;
		venueManager.fetchVenues(req, res, next).then(function(venuesResult){
			// --- this piece of code just limits the description to first 140 characters ----
			var tempString='';
			var countSkip=0;
			// limit the description to 140 characters and then add ellipsis
			for (var i=0; i<venuesResult.result.length; i++){
				if (venuesResult.result[i].detaildescription){
					if (venuesResult.result[i].detaildescription.length > 140){
						tempString = venuesResult.result[i].detaildescription.substring(0,140)+'...';
						venuesResult.result[i].detaildescription = tempString;
					}else{
						tempString = venuesResult.result[i].detaildescription.substring(0,140);
						venuesResult.result[i].detaildescription = tempString;
					}
				}
				tempString='';
			}
			// --- this peice of code just limits the description to first 140 characters ---

			var dateTimeRange = {};
			var startDateTimeJS = new Date(req.body.whenstart);
			console.log('start date time js...'+startDateTimeJS);
			dateTimeRange.start = startDateTimeJS;
			var endDateTimeJS= new Date(req.body.whenstart);
			endDateTimeJS.setTime(startDateTimeJS.getTime()+req.body.duration*60*60*1000);
			dateTimeRange.end = endDateTimeJS;
			console.log('free busy end date time:'+dateTimeRange.end);

			for (var i=0; i<venuesResult.result.length; i++){
				venuesResult.result[i].dateTimeRange = dateTimeRange;
			}
			var asyncIterator = googleCalendar.asyncIteratorFunc;
			async.map(venuesResult.result,asyncIterator, function (err, results){
//				console.log('results after iterator call:'+results);
				for (var k=results.length-1; k>=0; k -= 1){ // a reverse loop is needed because splice re-indexes the array from current point to end of array.
					if (!(results[k].available)){
						countSkip++;
						results.splice(k,1);
					}
				}
				res.locals.partials.venues = results;
				var perPageLimit = 5;
				var pageSkipped = Math.floor(countSkip / perPageLimit) || 0;
				res.render('search_result', {search_obj: {pagination: {page:req.query.page-pageSkipped || 1, limit:perPageLimit, totalRows:venuesResult.itemCount-countSkip} },
							    where: req.body.where,
							    whenstart: String(req.body.whenstart),
							    duration: req.body.duration, 
								layout: false,
				});
			});	
		});
	});
}
