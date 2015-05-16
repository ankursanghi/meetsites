var express = require('express');
var fortune = require('./lib/fortune.js');
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

app.get('/', function(req, res){ 
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
