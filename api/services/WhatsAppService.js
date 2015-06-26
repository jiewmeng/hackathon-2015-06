var whatsapi = require('whatsapi');
var Promise = require('bluebird');

var ONE_MINUTE = 60 * 1000;
var ONE_HOUR = 60 * ONE_MINUTE;
var ONE_DAY = 24 * ONE_HOUR;

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

	/**
	 * #Tag Here!!! -c -t tomorrow
	 */
	_handleTopicMessage: function(message) {
		var self = this;
		var indexOfOptions = message.body.search(/(\s-c(\s|$)|(\s-t\s))/);
		var optionsStr = message.body.substr(indexOfOptions);
		var name = indexOfOptions > -1 ? message.body.substr(1, message.body.search(/(\s-c(\s|$)|(\s-t\s))/)).trim() : message.body.substr(1);
		var fromNum = message.from.substring(0, message.from.indexOf('@'));
		var merging = 0;
		var topic;

		Topics.findOrCreate({
			name: name
		})
			.then(function(t) {
				topic = t;
				// handle consolidate
				var consolidateMatch = (message.body.search(/\s-c(\s|$)/) > -1);
				if (!consolidateMatch) {
					return;
				}
				return Cards.find({
					where: {
						topic: sails.config.defaultTopicId,
						from: fromNum
					},
					sort: 'createdAt ASC'
				})
					.then(function(cards) {
						merging = cards.length;

						var newContent = cards.map(function(card) {
							return card.content;
						}).join('\n ');

						return Promise.all([
							newContent,
							Cards.destroy({id: _.pluck(cards, 'id')})
						]);
					})
					.spread(function(newContent) {
						return Cards.create({
							type: 'text',
							content: newContent,
							from: fromNum,
							topic: sails.config.defaultTopicId,
							datetime: Date.now()
						});
					})
					.then(function(card) {
						return self._sendMessage(fromNum, 'Merged ' + merging + ' card(s)');
					})
					.catch(function(err) {
						throw err;
					});
			})
			.then(function() {

				// you will get the cue on
				var cueMatch = /\s-t\s(.*)/.exec(optionsStr);
				if (cueMatch instanceof Array && cueMatch.length > 1) {
					var cueTimeStr = cueMatch[1].toLowerCase().trim();
					var cueTime = -1;

					console.log('cueTimeStr is ' + cueTimeStr);

					if (cueTimeStr == 'soon') {
						cueTime = Date.now() + ONE_MINUTE;
					} else if (cueTimeStr == 'tomorrow') {
						cueTime = Date.now() + ONE_DAY;
					} else if (cueTimeStr == 'next week') {
						cueTime = Date.now() + ONE_DAY * 7;
					} else {
						var cueDetailsMatch = /(\d+) (mins?|hours?|days?|weeks?|months?)/.exec(cueTimeStr);
						if (!(cueDetailsMatch instanceof Array) || cueDetailsMatch.length != 3) {
							return;
						}
						var cueNum = parseInt(cueDetailsMatch[1], 10);
						var cueDuration = cueDetailsMatch[2];

						if (cueDuration.indexOf('min') > -1) {
							cueTime = Date.now() + (cueNum * ONE_MINUTE);
						} else if (cueDuration.indexOf('hour') > -1) {
							cueTime = Date.now() + (cueNum * ONE_HOUR);
						} else if (cueDuration.indexOf('day') > -1) {
							cueTime = Date.now() + (cueNum * ONE_DAY);
						} else if (cueDuration.indexOf('week') > -1) {
							cueTime = Date.now() + (cueNum * 7 * ONE_DAY);
						} else if (cueDuration.indexOf('month') > -1) {
							cueTime = Date.now() + (cueNum * 30 * ONE_DAY);
						}
					}

					if (cueTime > -1) {
						return Cards.update({
							topic: sails.config.defaultTopicId,
							from: fromNum
						}, { cue: cueTime });
					}
				}
			})
			.then(function() {
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
						self._sendMessage(fromNum, 'Added ' + cards.length + ' card(s) to topic "' + name + '"'),
						(cards[0].cue > -1) ? self._sendMessage(fromNum, 'You will get the cue on ' + (new Date(cards[0].cue).toString())) : false
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
				console.error(err.stack);
			});
	},

	_handleNewTextCard: function(message) {
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
