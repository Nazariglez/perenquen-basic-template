var config = require('./config');

module.exports = PQ.Class.extend({
    _init: function(){
        this.game = new PQ.Game(config);
    },

    loadBar: function(){
        //TODO: Basic load bar, and PQ's load bar
    }
});