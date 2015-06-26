var whatsapi = require('whatsapi');
var Promise = require('bluebird');

module.exports = {
	connect: function() {
		var self = this;

		return new Promise(function(resolve, reject) {
			var wa;

			sails.config.wa = wa = whatsapi.createAdapter({
			    msisdn: '6583607824',
			    username: 'Colin Bot',
			    password: 'QqxuQlOKsPBeWxvU3FN5aOYz7HI=',
			    ccode: '65'
			});

			wa.connect(function(err){
			    if (err) return reject(err);

			    console.log('WhatsApp: Connected ... Logging in ...');
			    wa.login(function(err) {
		            if (err) {
		                console.error('WhatsApp:', err);
		                return reject(err);
		            }

					console.log('WhatsApp: Set status to offline ... and wait awhile ...');
		            self.setOffline();
					setTimeout(function() {
						self.setOnline();
						resolve();
					}, 1000);
		        });
			});
		});
	},

	setOnline: function() {
		if (sails.config.waOnline) {
			console.log('WhatsApp: Already online!');
			return false;
		}
		sails.config.wa.sendIsOnline();
		sails.config.waOnline = true;
		console.log('WhatsApp: Online');
	},

	setOffline: function() {
		console.log('WhatsApp: Offline');
		sails.config.wa.sendIsOffline();
		sails.config.waOnline = false;
	},

	_sendMessage: function(destNum, message) {
		return new Promise(function(resolve, reject) {
			var wa = sails.config.wa;

			wa.sendComposingState(destNum);
			setTimeout(function() {
				wa.sendPausedState(destNum);

				wa.sendMessage(destNum, message, function(err, id) {
					if (err) return reject(err.message);
					resolve();
				});
			}, 1000);
		});
	},

	_associateTopicLatestCard: function(topicId) {
		var self = this;
		return Cards.findOne({
			where: { topic: topicId },
			sort: 'createdAt DESC',
			limit: 1
		})
			.then(function(card) {
				return Topics.update({ id: topicId }, { latestCard: card.id });
			})
			.then(function(topic) {
				console.log('Associated topic latest card', topic);
				// return self._sendMessage()
			})
			.catch(function(err) {
				console.error('Failed to associate topic latest card', err);
				throw err;
			});
	},

	_createCard: function(card, from) {
		card.from = from.substring(0, from.indexOf('@'));

		return Cards.create(card)
			.then(function(card) {
				console.log('Create card success:', card);
			})
			.catch(function(err) {
				console.error('Creating card error:', err);
			});
	},

	_handleTopicMessage: function(message) {
		var self = this;
		var name = message.body.substring(1);
		var fromNum = message.from.substring(0, message.from.indexOf('@'));
		Topics.findOrCreate({
			name: name
		})
			.then(function(topic) {
				// associate past untagged messages with project
				return Cards.update({
					topic: sails.config.defaultTopicId,
					from: fromNum
				}, { topic: topic });
			})
			.then(function(cards) {
				if (cards.length > 0) {
					return Promise.all([
						cards[0].topic,
						self._sendMessage(fromNum, 'Associated ' + cards.length + ' card(s) with topic "' + name + '"')
					]);
				}
				return Promise.all([
					false,
					self._sendMessage(fromNum, 'Nothing to associate with topic!')
				]);
			})
			.spread(function(topicId) {
				if (!topicId) return;
				return self._associateTopicLatestCard(topicId);
			})
			.catch(function(err) {
				console.error('Failed to handle topic message', err);
			});
	},

	_handleNewTextCard: function(message) {
		console.log(message);
		var self = this;
		var card = {
			type: 'text',
			whatsAppId: message.id,
			content: message.body,
			datetime: new Date(message.date).getTime(),
			// topic: defaultTopicId
		};
		self._createCard(card, message.from);
	},

	attachOnMessage: function() {
		var self = this;
		sails.config.wa.on('receivedMessage', function(message) {
			var startsWithHashtag = message.body.match(/^#/);
			if (startsWithHashtag instanceof Array && startsWithHashtag.length > 0) { // message starts with # (hashtag)
				self._handleTopicMessage(message);
			} else {
				self._handleNewTextCard(message);
			}
		});
	},

	attachOnImage: function() {
		var self = this;
		sails.config.wa.on('receivedImage', function(message) {
			var card = {
				type: 'image',
				whatsAppId: message.id,
				content: message.caption,
				image: message.url,
				datetime: new Date(message.date).getTime(),
				// topic: defaultTopicId
			};
			self._createCard(card, message.from);
		});
	}
};
