var config = require('../config'),
    LoadBar = require('./LoadBar'),
    MainScene = require('./scenes/MainScene');

module.exports = PQ.Class.extend({
    _init: function(){
        this.game = new PQ.Game(config);
        this.game.start();
        this._loadLogo();
    },

    _loadLogo: function(){
        this.game.assetLoader.add([
            {url: "./assets/images/perenquen-logo.png", name: "perenquen-logo"}
        ]).load(this._loadAssets.bind(this));
    },

    _loadAssets: function(){
        this.game.assetLoader.reset();
        var loadBar = new LoadBar(this.game, {

            //Dark style
            minTime : 6000,
            width : 150,
            height : 12,
            backgroundColor: 0x000000,
            colorOut: 0xffffff,
            colorIn: 0xc0c0c0

        });


        loadBar.add([
            //add your assets here to load them
            //example {name: "logo", url: "logourl.png"}
            //example {url : "package.json"}
        ]);

        loadBar.load(this.onAssetsLoaded.bind(this));
    },

    onAssetsLoaded: function(){
        console.log('All assets loaded!');
        //Create and add a custom scene
        var mainScene = new MainScene(this.game);
        this.game.sceneManager.addScene(mainScene);

        //Render this scene now
        this.game.sceneManager.setCurrentScene(mainScene);
    }
});