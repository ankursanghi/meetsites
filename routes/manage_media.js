var AWS = require('aws-sdk');
var S3FS = require('s3fs');
var multer = require('multer');
var s3 = require('multer-s3');
var aws_creds = require('../aws_credentials.json');
var manageVenues = require('./manage_venues.js');

AWS.config.loadFromPath('./aws_credentials.json');
AWS.config.update({region: 'us-east-1'});

var options = {};
function storeMedia (req, res){
	var fsImpl = new S3FS('meetsites-images/VenueImages', options);
	//	fsImpl.writeFile('message.txt', 'Hello Node', function (err) {
	//		if (err) throw err;
	//		console.log('It\'s saved!');
	//	});

	// get the file location
	var file = req.files.file;
	var stream = fs.createReadStream(file.path);

	return fsImpl.writeFile(fileName,stream).then(function(){
		fs.unlink(file.path,function(err){
			if(err)
			console.error(err);
		});

		res.send('done');

	}).catch(function (err) {
		return res.status(500).send({
			message: "s3fs error!"
		});
	});
}

function storeMediaStream (app){

	var upload = multer({
		storage: s3({
				dirname:'VenueImages',
				bucket: 'meetsites-images',
				secretAccessKey: aws_creds.secretAccessKey, 
				accessKeyId: aws_creds.accessKeyId,
				region: 'us-east-1',
				params: {ContentType: "image/jpeg"}
			 })
	});
//	var upload = multer({dest: './uploads'});
	// Got to add some filters on the types of files people need to upload.
	app.get('/imgUpload', function(req, res, next){
		res.render('imgUpload', {layout: false, name: req.session.name});
	});

	app.post('/imgUpload', upload.array('photos', 10), function(req, res, next){
	//	var fsImpl = new S3FS('meetsites-images/VenueImages', options);
		console.log('req.files:'+JSON.stringify(req.files));
		// console.log('req.file:'+JSON.stringify(req.file));
		console.log(req.body); // form fields
	    	console.log(req.files); // fo
		// add the code to update the mongoDB object with the file Names and Venue Name. TBD
		manageVenues.addImagesToVenues(req.files, req.body.venues); // having this venueName here requires that I show list of registered venues for this host
		res.send ('done');
	});
}
function baseS3Test (){
	var s3 = new AWS.S3({params: {Bucket: 'meetsites-images', Key: 'key1'}});
	s3.createBucket({Bucket: 'meetsites-images'}, function() {
		var data = {Bucket: 'meetsites-images', Key: 'key1', Body: 'Hello!'};
		s3.putObject(data, function(err, data) {
			if (err) {
				console.log(this.httpResponse.body.toString()); // print response body
				console.log("Error uploading data: ", err);
			} else {
				console.log("Successfully uploaded data to meetsites-images/key1");
			}
		});
	});
}

function listBuckets (){
	var s3 = new AWS.S3();
	s3.listBuckets(function(err, data) {
		if (err) { console.log("Error:", err); }
		else {
			for (var index in data.Buckets) {
				var bucket = data.Buckets[index];
				console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
			}
		}
	});
}

function fetchFile (){

}
exports.storeMedia = storeMedia;
exports.storeMediaStream = storeMediaStream;
exports.baseS3Test = baseS3Test;
exports.listBuckets = listBuckets;
