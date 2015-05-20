var express = require('express');
var fortune = require('./lib/fortune.js');
var googleCalendar = require('./quickstart.js');
var Q = require('q'); // Get Q to manage asynch calls. Callback hell is no fun!!
//var circle = require('./circle.js');
var app = express();
app.set('port', process.env.PORT || 8888);

// set up handlebars view engine
var handlebars = require('express-handlebars') .create({ defaultLayout:'meetsites' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//
// middleware to detect test=1 in querystring
app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' &&
	req.query.test === '1';
next();
});

// middleware to insert partial in the response object
app.use(function(req, res, next) {
	if(!res.locals.partials) res.locals.partials = {}; 
//	res.locals.partials.calResponse = [
//	{
//		"summary" : "Recurring Touchbase",
//		"start" : {
//			"dateTime" : "2015-05-21T19:00:00-04:00"
//		},
//		"end" : {
//			"dateTime" : "2015-05-21T20:00:00-04:00"
//		}
//	},
//	{
//		"summary" : "Recurring Touchbase 2",
//		"start" : {
//			"dateTime" : "2015-05-21T20:00:00-04:00"
//		},
//		"end" : {
//			"dateTime" : "2015-05-21T20:00:00-04:00"
//		}
//	}
//	];
//	googleCalendar.getCalEvents().then(function(response) { items_json = JSON.stringify(response.items); });
//	res.locals.partials.calResponse = items_json;
	next();
});

app.get('/', function(req, res){
//	res.send('circle details' + JSON.stringify(circle.circleDetails(7)));
	// The reason response.items cannot be pulled out of the googleCalendar quickStart js is because the scope of the 
	// variables in node is limited to the module.
	// perhaps there is a way to use exports to fetch this variable out to this module.
//	googleCalendar.getCalEvents().then(function(response) { res.locals.partials.calResponse = response.items;
//	res.render('home'); });
	// the way I got around this issue is by passing the res object into getCalEvents and setting the partials.calResponse in
	// the getCalEvents
	// this is also a great way to pass parameters to the api by parsing out the req body (on post) or parameters (on get)
	googleCalendar.getCalEvents(res).then(function(response){res.render('home');});
	
});

// Printing stringified JSON
app.get('/jsonTest', function(req, res){ 
	res.render('home');
});

app.get('/about', function(req, res){
	res.render('about', {fortune: fortune.getFortune(), pageTestScript:'./public/qa/tests-about.js'});
});
app.get('/headers', function(req,res){
	res.set('Content-Type','text/plain');
	var s='';
	for(var name in req.headers) s += name + ': ' + req.headers[name] + '\n'; res.send(s);
});
app.get('/csstest', function(req,res){
	res.render('csstest', { layout: false});
});
app.get('/javascript_test', function(req,res){
	res.render('javascript_test', { layout: false});
});
// Declare static content location
app.use(express.static(__dirname + '/public'));

app.use(function(req, res,next){ 
	res.status(404);
	res.render('404');
});
// custom 500 page
app.use(function(err, req, res, next){ 
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
		app.get('port') + '; press Ctrl-C to terminate.' );
});
