var _ = require('lodash');

module.exports = {
	getAll: function(req, res) {
		Topics.find()
			.sort('name ASC')
			.populate('latestCard')
			.then(function(topics) {
				var transformedTopics = topics.map(function(topic) {
					var obj = _.pick(topic, ['latestCard', 'name', 'id']);
					obj.latestCard = _.pick(obj.latestCard, ['type', 'content', 'datetime', 'image', 'id']);
					return obj;
				});

				res.json(transformedTopics);
			})
			.catch(function(err) {
				console.log('failed to get list of topics', err);
				res.json({
					error: 'Failed to get list of topics'
				}, 500);
			});
	}
}
