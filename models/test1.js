var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
	_id: {type: String, lowercase: true, trim: true},
    	name: {first: String, last: String},
    	salt: {type: String, required: true},
    	hash: {type: String, required: true},
    	token: {
		access_token: {type: String},
    		refresh_token: {type: String},
    		token_type: {type: String},
    		expiry_date: {type: String},
	}
    	access_token: String,
    	refresh_token: String,
});

userSchema.methods.testMethod = function(){
	return access_token;
};

var User = mongoose.model('User', userSchema);
module.exports=User;
