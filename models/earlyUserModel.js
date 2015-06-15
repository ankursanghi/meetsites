var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	_id: {type: String, lowercase: true, trim: true},
    	name: String,
});

var earlyUser = mongoose.model('earlyUser', userSchema);
module.exports=earlyUser;
