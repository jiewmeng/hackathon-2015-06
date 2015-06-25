module.exports = {
	online: function(req, res) {
		if (sails.config.waOnline) {
			return res.send('Already online');
		}

		sails.config.wa.sendIsOnline();
		sails.config.waOnline = true;
		res.send('Set online');
	},

	offline: function(req, res) {
		sails.config.wa.sendIsOffline();
		sails.config.waOnline = false;
		res.send('Set offline');
	}
}
