module.exports = {
	attributes: {

		whatsAppId: {
			type: 'string',
			unique: true,
			required: true,
			index: true
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
