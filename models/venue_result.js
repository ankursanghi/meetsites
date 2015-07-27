var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var venue_schema = mongoose.Schema({
	_id: {type: String, lowercase: true, trim: true},
    	host_email: {type: String},
    	uses: {
		kids:Boolean,
    		party:Boolean,
    		corporate:Boolean,
	},
    	address: {line1: String,
		  line2: String,
    		  city: String,
    		  zip: String,
	},
    	phone: [String],
    	ameneties:{
		   wifi: Boolean,
    		   coffee: Boolean,
    		   posteventcleaning: Boolean,
	},
	pic_locations: [String]
});
venue_schema.plugin(mongoosePaginate);

var venue = mongoose.model('venue', venue_schema );
module.exports=venue;
