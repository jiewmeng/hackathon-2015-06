module.exports = {
	attributes: {

		whatsAppId: {
			type: 'string'
		},

		type: {
			type: 'string',
			enum: ['text', 'image'],
			required: true
		},

		content: {
			type: 'string',
			defaultsTo: ''
		},

		image: {
			type: 'string',
			defaultsTo: ''
		},

		datetime: {
			type: 'integer',
			required: true
		},

		topic: {
			model: 'Topics'
		},

		cue: {
			type: 'integer',
			defaultsTo: -1
		},

		from: {
			type: 'string',
			required: true
		}

	},

	beforeCreate: function(values, cb) {
		values.topic = sails.config.defaultTopicId;
		cb();
	},

	afterCreate: function(newCard, cb) {
		Topics.update(
			{ id: sails.config.defaultTopicId },
			{ latestCard: newCard.id }
		).exec(cb);
	}
}
