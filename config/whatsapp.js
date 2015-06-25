var whatsapi = require('whatsapi');

module.exports.whatsapp = function() {
	var wa = whatsapi.createAdapter({
	    msisdn: '6583607824',
	    username: "Colin Bot",
	    password: 'QqxuQlOKsPBeWxvU3FN5aOYz7HI=',
	    ccode: '65'
	});

	wa.connect(function(err){
	    if(err){
	        console.log(err);
	        return;
	    }

	    console.log('Connected');
	    wa.login(logged);
	});
};
