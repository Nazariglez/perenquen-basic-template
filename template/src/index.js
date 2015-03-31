var config = require('./config'),
    plugin = require('./Plugin'),
    Main = require('./game/Main');

plugin.enable(config.plugins);

PQ.config.useDeltaAnimation = config.useDeltaAnimation;
PQ.config.useSortChildrenByDepth = config.useSortChildrenByDepth;

module.exports = new Main();