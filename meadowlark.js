var express = require('express');
var fortune = require('./lib/fortune.js');
var googleCalendar = require('./googleapi.js');
var Q = require('q'); // Get Q to manage asynch calls. Callback hell is no fun!!
var credentials = require('./credentials.js'); // to learn to use sessions
var bodyParser = require('body-parser');
var signup = require('./routes/signup.js');
var login = require('./routes/login.js');
var storeToken = require('./routes/storeToken.js');
var store_earlyUser= require('./routes/store_earlyUser.js');
var venueManager = require('./routes/manage_venues.js');
var paginateHelper = require('express-handlebars-paginate');
var util = require('util');
var mediaManager = require('./routes/manage_media.js');
var searchManager = require('./routes/manage_search.js');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var layouts = require('handlebars-layouts');
var fs = require('fs');
var async = require('async');

var db = require('./models/db.js');

var app = express();
app.set('port', process.env.PORT || 8888);

// use cookie parser for cookie secret
app.use(require('cookie-parser')(credentials.cookieSecret));
// use the express session as the memory store. Using persistent db is a better way. This is just to learn the topic
// app.use(require('express-session')());
app.use(session({
	    store: new MongoStore({ mongooseConnection: db.connection}),
	    secret:credentials.cookieSecret,
	    resave:false,
	    saveUninitialized:false

}));

// To use forms use express body parser that parses incoming requests
app.use(bodyParser());

// set up handlebars view engine
var hbs = require('express-handlebars');
var handlebars = hbs.create({ defaultLayout:'meetsites_new',
				helpers : {
					paginateHelper: paginateHelper.createPagination,
					hrefMaker: function(my_link, text){
							if (my_link=='') return '';
							var url = encodeURIComponent(handlebars.handlebars.escapeExpression(my_link));
							var result = "<a href=/host_detail?_id=" + url + ">";
							return new handlebars.handlebars.SafeString(result);
						},
    // imgLinkMaker is used in hostdetails page
					imgLinkMaker: function(image){
							if (image =='') return '';
						//	var url = encodeURIComponent(handlebars.handlebars.escapeExpression(image));
							var result = '<img src="' + image + '" alt="slidebg1" data-bgfit="cover" data-bgposition="center center" data-bgrepeat="no-repeat">';
							return new handlebars.handlebars.SafeString(result);
						},
    					imgHrefMakerHostDetail: function(imglocation, image){
							      if(imglocation=='' || image =='') return '';
							      var result = '<a data-fancybox-type="image" href="'+imglocation+image+'" rel="gallery" class="fancybox img-hover-v1" title="'+image+'">';
							      return new handlebars.handlebars.SafeString(result);
					      },
					imgTagMakerHostDetail: function(imglocation, image){
							      if(imglocation=='' || image =='') return '';
							      var result = '<img class="img-responsive" src="'+imglocation+image+'" alt="">';
							      return new handlebars.handlebars.SafeString(result);
					      },
					imgTagMakerSearchRes: function(imglocation, image, options){
							      if(imglocation=='' || image =='') return '';
							      var result = '<img ';
							      var attributes =[];
							      for (var attributeName in options.hash) {
								   attributes.push(attributeName + '="' + options.hash[attributeName] + '"');
							      }
							      var otherParms = attributes.join(' '); 
							      result += otherParms+'" src="'+imglocation+image+'" alt="">';
							      console.log('new imgTagmaker:'+result);
							      return new handlebars.handlebars.SafeString(result);
					      },
				        section: function(name, options){
						     if(!this._sections) this._sections = {};
						     this._sections[name] = options.fn(this);
						     return null;
					 }
				}
		  });
//console.log('hbs is:'+util.inspect(hbs.ExpressHandlebars,false, null));
// ------------------------ loading partials here explicity with handlebars -----------------------
var partialsDir = __dirname + '/views/partials';
var filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
	var matches = /^([^.]+).handlebars$/.exec(filename);
	  if (!matches) {
		      return;
		        }
	  var name = matches[1];
	  var template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
	  handlebars.handlebars.registerPartial(name, template);
});
// This generates an object containing the layout helpers and registers them with handlebars
layouts.register(handlebars.handlebars);
// ------------------------------------- loading partials end ------------------------------------
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
//
var connectString;
switch(app.get('env')){ 
	case 'development':
		connectString = credentials.mongo.development.connectionString;
		break;
	case 'production':
		connectString = credentials.mongo.production.connectionString;
		break;
	default:
		throw new Error('Unknown execution environment: ' + app.get('env'));
};
// Declare static content location
app.use(express.static(__dirname + '/public'));
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

// console.log('partials loaded? See:'+JSON.stringify(handlebars.handlebars.partials));

app.get('/', function(req, res){
	// The reason response.items cannot be pulled out of the googleCalendar quickStart js is because the scope of the 
	// variables in node is limited to the module.
	// Perhaps there is a way to use exports to fetch this variable out to this module.
	// the way I got around this issue is by passing the res object into getCalEvents and setting the partials.calResponse in
	// the getCalEvents
	// this is also a great way to pass parameters to the api by parsing out the req body (on post) or parameters (on get)
	// res.render('landingpage');
	 res.render('index', {layout: false});
	//	googleCalendar.getCalEvents(res).then(function(response){
	//		res.cookie('signed_monster', 'nom nom', { signed: true });	
	//		res.locals.partials.calResponse = response.items;
	//		res.render('home');});

});

// landing page signup would be app.post on the index page
app.post('/early_signup', function(req, res, next){
	console.log('When a submit is hit on the index page...');
	store_earlyUser(req,res,next).then(function(newUser){
		res.sendFile('views/ajax-response.html', {root: __dirname});
	});
	// TODO include an if in the index view so that the modal shows open with a thank you message when someone signs up!
	// TODO write a store_earlyUser function
	// TODO push this to github and to the server
});
app.get('/early_signup_reset', function(req, res){
	console.log('signup reset now');
	res.sendFile('views/ajax-form.html', {root: __dirname});
});

// call the signup function from the signup module.
signup(app); // when the user fills out the form, they are presented with a page to approve access to their Google calendar
// after the approval, the callback url points to oauth2callback

// send to a function to check whether the venue is already set-up, if not 
// present the venues page.
// do a redirect here to profile page
app.get('/oauth2callback', function(req, res, next){ 
	storeToken(req, res, connectString).then(function (doc){
		venueManager.checkIfExists(req,res,next).then(function(venue){
			res.writeHead(301, {Location: '/hostprofile'});
			res.end();
		},
		// IF the function below is being called, it means that venue has not been stored for this user yet.
		function(err){
			console.log('error from checkIfExists'+err);
			res.writeHead(301, {Location: '/venue'});
			res.end();
		});
	});
});
// handle the get/post on venue form here
app.get('/venue',function(req,res, next){
	res.render('venue-form');
});
app.post('/venue', function(req,res,next){
	venueManager.storeVenue(req).then(function(doc){
		res.writeHead(301, {Location: '/hostprofile'});
		res.end();
	});
});

// API to serve the AJAX request from UI
app.get('/fetchVenues', function(req,res,next){
	venueManager.fetchVenues(req, res, next).then(function(venuesResult){
		var resultObj = venuesResult.result;
		var returnObj =[];
		// the same api returns the JSON for venue detail if req.query.venuename is populated
		// fetchVenues function already looks at the req.query.venuename and fetches details of the specified venue
		if (req.query.venuename){
			res.json(resultObj);
		}else{
			resultObj.forEach(function(elem, idx){
				returnObj.push({"venueName":elem._id});	
			});
			res.json(returnObj);
		}
	});
});
// Log in to the main application here
// pass in the callback of venueManager.checkIfExists to see if there is a venue.
// the login route will check 
login(app,venueManager.checkIfExists);

//route to manage search
searchManager(app);

// Printing stringified JSON
app.get('/dashboard', function(req, res){ 
	// TODO - add the logic to pick out the right mongoose connection string (prod or dev) and the session user-email
	// then, call the getCalEvents function with the connection string as one of the param
	// the getCalEvents will respond back
	googleCalendar.getCalEvents(req, res, connectString).then(function(response){
		res.cookie('signed_monster', 'nom nom', { signed: true });	
		res.locals.partials.calResponse = response.items;
		res.render('dashboard');});
});

app.get('/about', function(req, res){
	res.render('about', {fortune: fortune.getFortune(), pageTestScript:'./public/qa/tests-about.js'});
});

app.get('/home', function(req, res, next){
	res.render('home');
});

// route to store media to Amazon AWS
mediaManager.storeMediaStream(app);

app.get('/host_detail', function(req,res,next){
	venueManager.fetchVenues(req,res, next).then(function(venueResult){
		console.log('results from single venue fetch...'+JSON.stringify(venueResult));
		var picRows = [];
		var tempPicRow=[];
		var counter=1;
		var rowNum=0;
		// get the first venue result by using index 0, then get the pictures tag and loop thru that
		venueResult.result[0].pictures.forEach(function(pic){
			console.log('the pic is:'+JSON.stringify(pic));
			if(counter<3){
				tempPicRow.push(pic);
			}else{
				counter=1;
				picRows.push(tempPicRow.slice(0));
				tempPicRow.length=0;
				tempPicRow.push(pic);
			}
			counter++;
		});
		if(tempPicRow.length >0) picRows.push(tempPicRow);
		console.log('new array:'+JSON.stringify(picRows));
		res.render('hostDetails', {layout: false, pictures:picRows, details:venueResult.result[0]});
	})
});
app.get('/javascript_test', function(req,res,next){
	// fetch the venues from database, then call makeArrayofFunctions 
	// to get a list of functions for each of the venues on the list
	var dateTimeRange = {};
	dateTimeRange.start = new Date("August 16, 2015 00:00:00");
	dateTimeRange.end = new Date("August 16, 2015 23:59:59");
	venueManager.fetchVenues(req,res, next).then(function(venueResult){
		// This loop is only going to be used for developing the functionality. TBD
		for (var i=0;i<venueResult.result.length;i++){
			venueResult.result[i].calendarID = 'meetsites4u@gmail.com';
		}
		var callback = function(funcArray){
			console.log('executing the callback now...'+JSON.stringify(funcArray));
			async.parallel(funcArray,
				function(err,results){
					if (err) return next(err);
					console.log('results:'+JSON.stringify(results));	
				});
		};
		var funcArray = googleCalendar.makeArrayOfFunctions(venueResult.result, dateTimeRange, callback);
		console.log('array of funcs:'+funcArray[0]);
	});
//	var result = makeArrayOfFunctions();
//	console.log('array of functions:'+JSON.stringify(result));
//	result[0]();
//	result[1]();
//	result[2]();
	res.render('javascript_test', { layout: false});
});

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

