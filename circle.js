var PI = Math.PI;


exports.circleDetails = function(r) {
	var myArea = PI * r * r;
       	var myCircumference = 2 * PI * r;
	var details = {
		area: myArea,
		circumference: myCircumference
	}
	return details;
};
//exports.area = function (r) {
//	  return PI * r * r;
//};
//
//exports.circumference = function (r) {
//	  return 2 * PI * r;
//};
