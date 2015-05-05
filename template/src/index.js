//window.PQ = require('perenquenjs');

var config = require('./config'),
    plugin = require('./Plugin'),
    Main = require('./game/Main');

//Enable all the plugins listed in the config.js
plugin.enable(config.plugins);

module.exports = new Main();