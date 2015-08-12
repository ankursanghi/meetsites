var Validation = function () {

    return {
        
        //Validation
        initValidation: function () {
	        $("#hostsettings").validate({                   
	            // Rules for form validation
	            rules:
	            {
	                hourlyrate:
	                {
	                    required: true,
	                    number: true
	                },
			city:
			{
				required: true,
			},
			state:
			{
				required: true,
			},
			zip:
			{
				required: true,
			}
	            },
	                                
	            // Messages for form validation
	            messages:
	            {
	                required:
	                {
	                    required: 'Please enter something'
	                },
	                email:
	                {
	                    required: 'Please enter your email address'
	                },
	                url:
	                {
	                    required: 'Please enter your URL'
	                },
	                date:
	                {
	                    required: 'Please enter some date'
	                },
	                min:
	                {
	                    required: 'Please enter some text'
	                },
	                max:
	                {
	                    required: 'Please enter some text'
	                },
	                range:
	                {
	                    required: 'Please enter some text'
	                },
	                digits:
	                {
	                    required: 'Please enter some digits'
	                },
	                number:
	                {
	                    required: 'Please enter some number'
	                },
	                minVal:
	                {
	                    required: 'Please enter some value'
	                },
	                maxVal:
	                {
	                    required: 'Please enter some value'
	                },
	                rangeVal:
	                {
	                    required: 'Please enter some value'
	                }
	            },                  
	            
	            // Do not change code below
	            errorPlacement: function(error, element)
	            {
	                error.insertAfter(element.parent());
	            }
	        });
        }

    };
}();
