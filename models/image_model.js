var mongoose = require('mongoose');

var images = mongoose.Schema({
    	name: String,
        imagelocation: String
});

var images = mongoose.model('images', images);
module.exports=images;
