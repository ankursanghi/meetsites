var Module = (function(){
	var privateProperty = 'foo';

	function privateMethod(args){
		console.log("inside private method");
		return "private method args:"+args
	}

	return {

		publicProperty: 'I am the Public Property',

    		publicMethod: function(args){
		    // do something
			console.log("inside public method");
		},

		privilegedMethod: function(args){
			      console.log("from within privilegedMethod..");
			      return privateMethod(args);
		}
	};
})();
Module.publicMethod();
console.log("to get to private property :"+Module.privilegedMethod('passedArgument'));
