var AWS = require('aws-sdk');
var S3FS = require('s3fs');

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

exports.storeMedia = storeMedia;
exports.baseS3Test = baseS3Test;
exports.listBuckets = listBuckets;
