/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var whatsapi = require('whatsapi');

module.exports.bootstrap = function(cb) {
    // init default topic
    Topics.findOrCreate({name: 'Uncategorized'})
        .then(function(defaultTopic) {
            console.log('Default topic id is ' + defaultTopic.id);
            sails.config.defaultTopicId = defaultTopic.id;

            // init whatsapp
            return WhatsAppService.connect();
        })
        .then(function() {
            WhatsAppService.attachOnMessage();
            WhatsAppService.attachOnImage();
            cb();
        })
        .catch(function(err) {
            throw err;
        });

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)

};
