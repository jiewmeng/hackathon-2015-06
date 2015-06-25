module.exports = {
	attributes: {

		name: {
			type: 'string',
			required: true,
			unique: true,
			index: true
		},

		latestCard: {
			model: 'Cards'
		}

	}
}
