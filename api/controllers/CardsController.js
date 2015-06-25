module.exports = {
	getRecent: function(req, res) {
		Cards.find({sort: 'createdAt DESC', limit: 30})
			.populate('topic')
			.then(function(cards) {
				res.json(cards.map(function(card) {
					var obj = _.pick(card, ['id', 'type', 'content', 'image', 'datetime', 'topic']);
					obj.topic = _.pick(obj.topic, ['id', 'name']);
					return obj;
				}));
			})
			.catch(function(err) {
				console.log('Failed to get list of recent cards', err);
				res.json({error: 'Failed to get list of recent cards'}, 500);
			});
	},

	getByTopic: function(req, res) {
		var topicId = req.params.topicId;
		Cards.find({
			where: { topic: topicId },
			sort: 'createdAt DESC'
		})
			.then(function(cards) {
				res.json(cards.map(function(card) {
					var obj = _.pick(card, ['id', 'type', 'content', 'image', 'datetime']);
					return obj;
				}));
			})
			.catch(function(err) {
				console.error('Failed to get cards by topic', err);
				res.json({error: 'Failed to get cards by topic'}, 500);
			});
	}
}
