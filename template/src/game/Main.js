var config = require('../config'),
    LoadBar = require('./LoadBar'),
    MainScene = require('./scenes/MainScene');

module.exports = PQ.Class.extend({
    _init: function(){
        game = this.game = new PQ.Game(config);
        this.game.start();
        this._loadLogo();
    },

    _loadLogo: function(){
        this.game.assetLoader.add([
            {url: "./assets/images/perenquenjs-logo.png", name: "perenquenjs-logo"}
        ]).load(this._loadAssets.bind(this));
    },

    _loadAssets: function(){
        var loadBar = new LoadBar(this.game, {
            minTime : 5000,
            width : 300,
            height : 40
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
        var mainScene = new MainScene(this.game);
        this.game.sceneManager.addScene(mainScene);
        this.game.sceneManager.setCurrentScene(mainScene);
    }
});