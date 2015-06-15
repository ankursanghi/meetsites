jQuery(function($) {
	$('body').on('submit',"#landing_page_form", function(event) {
		var $form = $(this);
		var $target = $($form.attr('data-target'));
//		alert('email:'+$("#landing_page_form").val());

		$.ajax({
			type: $form.attr('method'),
			url: $form.attr('action'),
			data: {
				'email': $("#email").val(),
				'name' : $("#name").val(),
			},
			success: function(data, status) {
				$target.html(data);
			}
		});
		event.preventDefault();
	});
	$('body').on('click',"#topclose", function(event) {
		var $target = $("#myModal");

		$.ajax({
			type: 'GET',
			url: '/early_signup_reset',
			success: function(data, status) {
				$target.html(data);
			}
		});
		event.preventDefault();
	});
});

