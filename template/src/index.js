var plugin = require('./Plugin'),
    config = require('./config'),
    Main = require('./game/Main');

plugin.enable(config.plugins);

module.exports = new Main();