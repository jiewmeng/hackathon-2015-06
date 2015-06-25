var _ = require('lodash');

module.exports = {
  getList: function(req, res) {
    Cards.find({where: {cue: {'>': 0}}, sort: 'cue DESC'})
      .populate('topic')
      .then(function(cued) {
        res.json(cued.map(function(card) {
          var obj = _.pick(card, ['id', 'type', 'content', 'image', 'datetime', 'topic', 'cue']);
          obj.topic = _.pick(obj.topic, ['id', 'name']);
          return obj;
        }));
      })
      .catch(function(err) {
        console.error('Failed to get cued cards', err);
        console.error(err.stack);
        res.status(500).json({error: 'Failed to get cued cards'});
      })
  }
}
