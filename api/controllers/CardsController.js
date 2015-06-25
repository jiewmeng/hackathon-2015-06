module.exports = {
	getRecent: function(req, res) {
		Cards.find({sort: 'createdAt DESC', limit: 30})
			.populate('topic')
			.then(function(cards) {
				res.json(cards.map(function(card) {
					var obj = _.pick(card, ['id', 'type', 'content', 'image', 'datetime', 'topic', 'cue']);
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
					var obj = _.pick(card, ['id', 'type', 'content', 'image', 'datetime', 'cue']);
					return obj;
				}));
			})
			.catch(function(err) {
				console.error('Failed to get cards by topic', err);
				res.json({error: 'Failed to get cards by topic'}, 500);
			});
	},

	delete: function(req, res) {
		var cardId = req.params.cardId;
		Cards.destroy({id: cardId})
			.then(function(cards) {
				if (!cards.length) {
					return res.status(404).json({error: 'No such card'});
				}
				res.json({success: true});
			})
			.catch(function(err) {
				res.status(500).json({error: 'Failed to delete card'});
			});
	},

	cue: function(req, res) {
		var cardId = req.params.cardId;
		var cue = parseInt(req.body.cue, 10);
		var update;

		if (cue > 0) {
			// cue
			update = Cards.update({id: cardId}, {cue: cue});
		} else {
			// uncue
			update = Cards.update({id: cardId}, {cue: -1});
		}

		update
			.then(function(updateds) {
				if (!updateds.length) {
					return res.status(404).json({error: 'No such card'});
				}
				res.json({success: true});
			})
			.catch(function(err) {
				console.error('Failed to cue card', err);
				console.error(err.stack);
				res.status(500).json({error: 'Failed to cue card'});
			});
	}
}
