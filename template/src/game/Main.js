var config = require('../config'),
    LoadBar = require('./LoadBar');

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
            height : 50
        });


        loadBar.add([
            //add your assets here

            {url : "package.json"}
        ]);

        loadBar.load(this.onAssetsLoaded.bind(this));
    },

    onAssetsLoaded: function(){
        console.log('All assets loaded!');
    }
});