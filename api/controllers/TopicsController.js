var _ = require('lodash');
var Promise = require('bluebird');

module.exports = {
	getAll: function(req, res) {
		Topics.find()
			.sort('name ASC')
			.populate('latestCard')
			.then(function(topics) {
				var transformedTopics = topics.map(function(topic) {
					var obj = _.pick(topic, ['latestCard', 'name', 'id']);
					obj.latestCard = _.pick(obj.latestCard, ['type', 'content', 'datetime', 'image', 'id']);
					obj.isDefault = (sails.config.defaultTopicId === obj.id);
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
	},

	delete: function(req, res) {
		var topicId = req.params.topicId;

		if (topicId === sails.config.defaultTopicId) {
			return res.status(400).json({error: 'Cannot remove default category'});
		}

		Promise.all([
			Cards.destroy({ topic: topicId }),
			Topics.destroy({ id: topicId })
		])
			.spread(function(cards, topics) {
				if (!topics.length) {
					return res.status(404).json({error: 'No such topic'});
				}
				res.json({success: true});
			})
	}
}
