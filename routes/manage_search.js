var venueManager = require('./manage_venues.js');

module.exports = function(app){
	app.get('/browse', function(req,res, next){
		venueManager.fetchVenues(req, res, next).then(function(venuesResult){
			console.log(venuesResult.result);
			var tempString='';
			// limit the description to 140 characters and then add ellipsis
			for (var i=0; i<venuesResult.result.length; i++){
				console.log('venuesResult no:'+i+' '+JSON.stringify(venuesResult.result[i]));
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
			res.locals.partials.venues = venuesResult.result;
			res.render('search_result', {search_obj: {pagination: {page:req.query.page || 1, limit:5, totalRows:venuesResult.itemCount}
			}});
		});
	});

	app.post('/browse', function(req,res, next){
		venueManager.fetchVenues(req, res, next).then(function(venues){
			res.locals.partials.venues = venues;
			res.render('search_result');
		});
	});
}
