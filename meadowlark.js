var express = require('express');
var fortune = require('./lib/fortune.js');
var googleCalendar = require('./quickstart.js');
var login_logic = require('./login_page.js');
var Q = require('q'); // Get Q to manage asynch calls. Callback hell is no fun!!
var credentials = require('./credentials.js'); // to learn to use sessions
var bodyParser = require('body-parser');
var signup = require('./routes/signup.js');
var oauth2callback = require('./routes/oauth2callback.js');

var mongoose = require('mongoose');

var app = express();
app.set('port', process.env.PORT || 8888);

// use cookie parser for cookie secret
app.use(require('cookie-parser')(credentials.cookieSecret));
// use the express session as the memory store. Using persistent db is a better way. This is just to learn the topic
app.use(require('express-session')());

// To use forms use express body parser that parses incoming requests
app.use(bodyParser());

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
	next();
});

app.get('/', function(req, res){
	//	res.send('circle details' + JSON.stringify(circle.circleDetails(7)));
	// The reason response.items cannot be pulled out of the googleCalendar quickStart js is because the scope of the 
	// variables in node is limited to the module.
	// Perhaps there is a way to use exports to fetch this variable out to this module.
	// the way I got around this issue is by passing the res object into getCalEvents and setting the partials.calResponse in
	// the getCalEvents
	// this is also a great way to pass parameters to the api by parsing out the req body (on post) or parameters (on get)
	googleCalendar.getCalEvents(res).then(function(response){
		res.cookie('signed_monster', 'nom nom', { signed: true });	
		res.render('home');});

});

// call the signup function from the signup module.
signup(app);


// Printing stringified JSON
app.get('/dashboard', function(req, res){ 
	res.render('home');
});

app.get('/oauth2callback', function(req, res){ 
// call the oauth2callback to process the oauth2callback auth code and getting tokens
	console.log('auth code is: '+req.query.code);
	login_logic.getNewToken(req.query.code).then(function(token) { oauth2callback(token).then(function(response){
			res.render('home');	
		}) ;
	});
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
// custom 500 page this is a catch all error handler
app.use(function(err, req, res, next){ 
	console.error(err.stack); // this dumps the error to the console.
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
		app.get('port') + '; press Ctrl-C to terminate.' );
});
