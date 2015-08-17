var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var images = require('../models/image_model.js');

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
    		  state: String,
    		  zip: String,
	},
    	phone: [String],
    	ameneties:{
		   wifi: Boolean,
    		   coffee: Boolean,
    		   posteventcleaning: Boolean,
	},
        pictures : [{type: mongoose.Schema.Types.ObjectId, ref: 'images'}],
	detaildescription: {type: String},
	hourlyrate: {type: Number},
	calendarID: {type: String}
});
venue_schema.plugin(mongoosePaginate);

var venue = mongoose.model('venue', venue_schema );
module.exports=venue;
