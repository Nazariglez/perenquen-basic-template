(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//window.PQ = require('perenquenjs');

var config = require('./config'),
    plugin = require('./Plugin'),
    Main = require('./game/Main');

//Enable all the plugins listed in the config.js
plugin.enable(config.plugins);

module.exports = new Main();
},{"./Plugin":2,"./config":3,"./game/Main":5}],2:[function(require,module,exports){
var path = "./plugins/";

function Plugin(){

    /**
     * Require and enable plugins with same name and filename
     * @param plugins {Array}
     */
    this.enable = function(plugins){
        if(typeof plugins === "string")plugins = [plugins];
        var len = plugins.length;
        for(var i = 0; i < len; i++){
            var url = path + plugins[i] + ".js";
            require(url);
        }

        PQ.plugin.enable(plugins);
    };

}

module.exports = new Plugin();
},{}],3:[function(require,module,exports){
module.exports = {
    //Game's id, uses to save data at localstorage
    id: 'pq.defaultbundle.id',

    //Version of this game, also uses in localstorage metadata
    version: "0.0.0",

    //Activate debug mode, to show bounds, etc...
    debug: false,

    //Log out the perenquen's name, version, and web
    sayHello: true,

    //Speed and rotation speed use delta time
    useDeltaAnimation: true,

    //Auto sort children when they are added to his parent, (if it's false, you can sort manually with container.sortChildrenById())
    useSortChildrenByDepth: false,

    //Game options
    game : {

        //Renderer width
        width: 800,

        //Renderer height
        height: 600,

        //The resolution of the renderer, used to scale in retina devices
        resolution: 1,

        //The canvas to use as a view, (by default perenquen creates one)
        canvas: null,

        //Color used like a renderer's background, (0x000000 by default)
        backgroundColor: 0x000000,

        //If the render view is transparent, default false
        transparentBackground: false,

        //Sets antialias (only applicable in chrome at the moment)
        useAntialias: false,

        //Use the WebGL renderer always it's available
        useWebGL: true,

        //enables drawing buffer preservation, enable this if you need to call toDataUrl on the webgl context
        preserveDrawingBuffer: false,

        //Use localStorage to save all you need with dataManager, if it's false, the data just delete at refresh
        usePersitantData: false,

        //Screen scale behavior when the canvas size is different to the window size, default GAME_SCALE_TYPE.NONE
        scaleType: PQ.GAME_SCALE_TYPE.NONE,

        //If the performance is poor, the time between frames never will go more slowly than this
        minFrameLimit: 30,

        //Pause the game when it lost the focus, (example: when you change the browser's tab) default true
        stopAtVisibiltyChange: true,

        //This sets if the CanvasRenderer will clear the canvas or not before the new render pass.
        clearBeforeRender: true

    },

    //Audio options
    audio : {

        //Use the WebAudio API always it's available
        useWebAudio: true,

        //Force the loader to load audio files in this order
        allowedExtensions: ["mp3", "ogg", "wav"]
    },

    //Input interaction options
    input : {
        enableMouse: false,
        enableKeyboard: false,
        //enableGamepad: false,
        enableAccelerometer: false,

        mouseCheckFrecuency: 30,
        disableContextMenu: true,
        preventDefault: true
    },

    plugins : [
        //Here your plugins name
        //"locale",
        //"gamepad"
    ]

};
},{}],4:[function(require,module,exports){
module.exports = PQ.Class.extend({
    _init: function(game, options){
        options = options||{};

        this.game = game;

        this.minTime = options.minTime || 6000;
        this.width = options.width || 150;
        this.height = options.height || 12;
        this.colorIn = typeof options.colorIn === "number" ? options.colorIn : 0xDBDBDE;
        this.colorOut = typeof options.colorOut === "number" ? options.colorOut : 0xb2b2b2;
        this.bgColor = typeof options.backgroundColor === "number" ? options.backgroundColor : 0xffffff;

        this.game.scene.setBackgroundColor(this.bgColor);

        this.callback = null;
        this.bar = new PQ.Graphics();
        this.loader = new PQ.AssetLoader();

        this.logoTween = null;
        this.barTween = null;

        this.ready = false;

        this.assetsNum = 0;
        this.timeForAsset = 0;
        this.progressForAsset = 0;

        this.count = 0;
    },

    add: function(){
        this.loader.add.apply(this.loader, arguments);
        return this;
    },

    load: function(callback){
        this.callback = callback;
        this._showLoadBar();
        this.loader.on('load', this._assetLoaded.bind(this));
        this.loader.load();
    },

    _showLoadBar: function(){
        //Perenquen.js logo
        var logo = new PQ.Sprite('perenquenjs-logo')
            .setAnchor(0.5, 1)
            .setScale(0.5)
            .setPosition(this.game.scene.width/2, this.game.scene.height/2)
            .addTo(this.game.scene);

        //Simple logo animation
        this.logoTween = logo.tween().to({
            y : logo.y+5
        }).setEasing(PQ.Easing.outSine())
            .setLoop()
            .setPingPong()
            .setTime(1500)
            .start();

        //Basic load data
        this.assetsNum = Object.keys(this.loader.resources).length;
        this.timeForAsset = this.minTime / (this.assetsNum || 1);
        this.progressForAsset = 100 / (this.assetsNum || 1);

        //Draw loadbar
        this.bar.beginFill(this.colorIn, 1)
            .drawRect(0, 0, this.width, this.height)
            .endFill()
            .lineStyle(3, this.colorOut, 1)
            .drawRect(0, 0, this.width, this.height)
            .setPosition(this.game.scene.width/2 - this.width/2, this.game.scene.height/2 + 20)
            .addTo(this.game.scene);

        //Add progress animation (linear) with a tween
        this.bar._totalProgress = 1;

        this.barTween = this.bar.tween().to({
            _totalProgress: this.progressForAsset
        }).setTime(this.timeForAsset)
            .setExpire()
            .start();

        //Re-draw loadbar
        var scope = this;
        this.bar.update = function(gameTime, delta){
            if(scope.ready)return;

            var progress = (scope.width * this._totalProgress / 100);

            if(scope.count === scope.assetsNum && scope.barTween.isEnded){
                scope.ready = true;
                scope._complete();
            }

            this.beginFill(scope.colorOut, 1)
                .drawRect(0, 0, progress, scope.height)
                .endFill();
        };

    },

    _assetLoaded: function(loader, resource){
        //Add a new tween for each asset loaded
        this.count++;
        if(this.count < this.assetsNum) {

            if(!this.barTween.isEnded) {

                //If barTween still exists, chain it a new tween
                this.barTween = this.barTween.chain().to({
                    _totalProgress: this.progressForAsset * (this.count+1)
                }).setTime(this.timeForAsset)
                    .setExpire();
            }else{

                //if barTween is expired, create a new tween
                this.barTween = this.bar.tween().to({
                    _totalProgress: this.progressForAsset * (this.count+1)
                }).setTime(this.timeForAsset)
                    .setExpire()
                    .start();
            }

        }
    },

    _complete: function(){
        if(this.callback)this.callback();

        //Remove the logo's tween (this tween don't stop never, so don't expire never...)
        this.logoTween.remove();
    }
});
},{}],5:[function(require,module,exports){
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
            {url: "./assets/images/perenquenjs-logo.png", name: "perenquenjs-logo"}
        ]).load(this._loadAssets.bind(this));
    },

    _loadAssets: function(){
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
},{"../config":3,"./LoadBar":4,"./scenes/MainScene":6}],6:[function(require,module,exports){
module.exports = PQ.Scene.extend({
   _init: function(game){
       this._super(game);
       this.id = "mainScene";

       //Remove this ^^
       this.showWelcome();
   },

    showWelcome: function(){
        var text = new PQ.Text('Hello world!!', {
            font: "30px Arial",
            fill: 0xffffff
        }).setPosition(this.width/2, this.height/2)
            .addTo(this);
    }
});
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvUGx1Z2luLmpzIiwic3JjL2NvbmZpZy5qcyIsInNyYy9nYW1lL0xvYWRCYXIuanMiLCJzcmMvZ2FtZS9NYWluLmpzIiwic3JjL2dhbWUvc2NlbmVzL01haW5TY2VuZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vd2luZG93LlBRID0gcmVxdWlyZSgncGVyZW5xdWVuanMnKTtcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyksXG4gICAgcGx1Z2luID0gcmVxdWlyZSgnLi9QbHVnaW4nKSxcbiAgICBNYWluID0gcmVxdWlyZSgnLi9nYW1lL01haW4nKTtcblxuLy9FbmFibGUgYWxsIHRoZSBwbHVnaW5zIGxpc3RlZCBpbiB0aGUgY29uZmlnLmpzXG5wbHVnaW4uZW5hYmxlKGNvbmZpZy5wbHVnaW5zKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTWFpbigpOyIsInZhciBwYXRoID0gXCIuL3BsdWdpbnMvXCI7XG5cbmZ1bmN0aW9uIFBsdWdpbigpe1xuXG4gICAgLyoqXG4gICAgICogUmVxdWlyZSBhbmQgZW5hYmxlIHBsdWdpbnMgd2l0aCBzYW1lIG5hbWUgYW5kIGZpbGVuYW1lXG4gICAgICogQHBhcmFtIHBsdWdpbnMge0FycmF5fVxuICAgICAqL1xuICAgIHRoaXMuZW5hYmxlID0gZnVuY3Rpb24ocGx1Z2lucyl7XG4gICAgICAgIGlmKHR5cGVvZiBwbHVnaW5zID09PSBcInN0cmluZ1wiKXBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgICAgIHZhciBsZW4gPSBwbHVnaW5zLmxlbmd0aDtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgICAgIHZhciB1cmwgPSBwYXRoICsgcGx1Z2luc1tpXSArIFwiLmpzXCI7XG4gICAgICAgICAgICByZXF1aXJlKHVybCk7XG4gICAgICAgIH1cblxuICAgICAgICBQUS5wbHVnaW4uZW5hYmxlKHBsdWdpbnMpO1xuICAgIH07XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgUGx1Z2luKCk7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLy9HYW1lJ3MgaWQsIHVzZXMgdG8gc2F2ZSBkYXRhIGF0IGxvY2Fsc3RvcmFnZVxuICAgIGlkOiAncHEuZGVmYXVsdGJ1bmRsZS5pZCcsXG5cbiAgICAvL1ZlcnNpb24gb2YgdGhpcyBnYW1lLCBhbHNvIHVzZXMgaW4gbG9jYWxzdG9yYWdlIG1ldGFkYXRhXG4gICAgdmVyc2lvbjogXCIwLjAuMFwiLFxuXG4gICAgLy9BY3RpdmF0ZSBkZWJ1ZyBtb2RlLCB0byBzaG93IGJvdW5kcywgZXRjLi4uXG4gICAgZGVidWc6IGZhbHNlLFxuXG4gICAgLy9Mb2cgb3V0IHRoZSBwZXJlbnF1ZW4ncyBuYW1lLCB2ZXJzaW9uLCBhbmQgd2ViXG4gICAgc2F5SGVsbG86IHRydWUsXG5cbiAgICAvL1NwZWVkIGFuZCByb3RhdGlvbiBzcGVlZCB1c2UgZGVsdGEgdGltZVxuICAgIHVzZURlbHRhQW5pbWF0aW9uOiB0cnVlLFxuXG4gICAgLy9BdXRvIHNvcnQgY2hpbGRyZW4gd2hlbiB0aGV5IGFyZSBhZGRlZCB0byBoaXMgcGFyZW50LCAoaWYgaXQncyBmYWxzZSwgeW91IGNhbiBzb3J0IG1hbnVhbGx5IHdpdGggY29udGFpbmVyLnNvcnRDaGlsZHJlbkJ5SWQoKSlcbiAgICB1c2VTb3J0Q2hpbGRyZW5CeURlcHRoOiBmYWxzZSxcblxuICAgIC8vR2FtZSBvcHRpb25zXG4gICAgZ2FtZSA6IHtcblxuICAgICAgICAvL1JlbmRlcmVyIHdpZHRoXG4gICAgICAgIHdpZHRoOiA4MDAsXG5cbiAgICAgICAgLy9SZW5kZXJlciBoZWlnaHRcbiAgICAgICAgaGVpZ2h0OiA2MDAsXG5cbiAgICAgICAgLy9UaGUgcmVzb2x1dGlvbiBvZiB0aGUgcmVuZGVyZXIsIHVzZWQgdG8gc2NhbGUgaW4gcmV0aW5hIGRldmljZXNcbiAgICAgICAgcmVzb2x1dGlvbjogMSxcblxuICAgICAgICAvL1RoZSBjYW52YXMgdG8gdXNlIGFzIGEgdmlldywgKGJ5IGRlZmF1bHQgcGVyZW5xdWVuIGNyZWF0ZXMgb25lKVxuICAgICAgICBjYW52YXM6IG51bGwsXG5cbiAgICAgICAgLy9Db2xvciB1c2VkIGxpa2UgYSByZW5kZXJlcidzIGJhY2tncm91bmQsICgweDAwMDAwMCBieSBkZWZhdWx0KVxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IDB4MDAwMDAwLFxuXG4gICAgICAgIC8vSWYgdGhlIHJlbmRlciB2aWV3IGlzIHRyYW5zcGFyZW50LCBkZWZhdWx0IGZhbHNlXG4gICAgICAgIHRyYW5zcGFyZW50QmFja2dyb3VuZDogZmFsc2UsXG5cbiAgICAgICAgLy9TZXRzIGFudGlhbGlhcyAob25seSBhcHBsaWNhYmxlIGluIGNocm9tZSBhdCB0aGUgbW9tZW50KVxuICAgICAgICB1c2VBbnRpYWxpYXM6IGZhbHNlLFxuXG4gICAgICAgIC8vVXNlIHRoZSBXZWJHTCByZW5kZXJlciBhbHdheXMgaXQncyBhdmFpbGFibGVcbiAgICAgICAgdXNlV2ViR0w6IHRydWUsXG5cbiAgICAgICAgLy9lbmFibGVzIGRyYXdpbmcgYnVmZmVyIHByZXNlcnZhdGlvbiwgZW5hYmxlIHRoaXMgaWYgeW91IG5lZWQgdG8gY2FsbCB0b0RhdGFVcmwgb24gdGhlIHdlYmdsIGNvbnRleHRcbiAgICAgICAgcHJlc2VydmVEcmF3aW5nQnVmZmVyOiBmYWxzZSxcblxuICAgICAgICAvL1VzZSBsb2NhbFN0b3JhZ2UgdG8gc2F2ZSBhbGwgeW91IG5lZWQgd2l0aCBkYXRhTWFuYWdlciwgaWYgaXQncyBmYWxzZSwgdGhlIGRhdGEganVzdCBkZWxldGUgYXQgcmVmcmVzaFxuICAgICAgICB1c2VQZXJzaXRhbnREYXRhOiBmYWxzZSxcblxuICAgICAgICAvL1NjcmVlbiBzY2FsZSBiZWhhdmlvciB3aGVuIHRoZSBjYW52YXMgc2l6ZSBpcyBkaWZmZXJlbnQgdG8gdGhlIHdpbmRvdyBzaXplLCBkZWZhdWx0IEdBTUVfU0NBTEVfVFlQRS5OT05FXG4gICAgICAgIHNjYWxlVHlwZTogUFEuR0FNRV9TQ0FMRV9UWVBFLk5PTkUsXG5cbiAgICAgICAgLy9JZiB0aGUgcGVyZm9ybWFuY2UgaXMgcG9vciwgdGhlIHRpbWUgYmV0d2VlbiBmcmFtZXMgbmV2ZXIgd2lsbCBnbyBtb3JlIHNsb3dseSB0aGFuIHRoaXNcbiAgICAgICAgbWluRnJhbWVMaW1pdDogMzAsXG5cbiAgICAgICAgLy9QYXVzZSB0aGUgZ2FtZSB3aGVuIGl0IGxvc3QgdGhlIGZvY3VzLCAoZXhhbXBsZTogd2hlbiB5b3UgY2hhbmdlIHRoZSBicm93c2VyJ3MgdGFiKSBkZWZhdWx0IHRydWVcbiAgICAgICAgc3RvcEF0VmlzaWJpbHR5Q2hhbmdlOiB0cnVlLFxuXG4gICAgICAgIC8vVGhpcyBzZXRzIGlmIHRoZSBDYW52YXNSZW5kZXJlciB3aWxsIGNsZWFyIHRoZSBjYW52YXMgb3Igbm90IGJlZm9yZSB0aGUgbmV3IHJlbmRlciBwYXNzLlxuICAgICAgICBjbGVhckJlZm9yZVJlbmRlcjogdHJ1ZVxuXG4gICAgfSxcblxuICAgIC8vQXVkaW8gb3B0aW9uc1xuICAgIGF1ZGlvIDoge1xuXG4gICAgICAgIC8vVXNlIHRoZSBXZWJBdWRpbyBBUEkgYWx3YXlzIGl0J3MgYXZhaWxhYmxlXG4gICAgICAgIHVzZVdlYkF1ZGlvOiB0cnVlLFxuXG4gICAgICAgIC8vRm9yY2UgdGhlIGxvYWRlciB0byBsb2FkIGF1ZGlvIGZpbGVzIGluIHRoaXMgb3JkZXJcbiAgICAgICAgYWxsb3dlZEV4dGVuc2lvbnM6IFtcIm1wM1wiLCBcIm9nZ1wiLCBcIndhdlwiXVxuICAgIH0sXG5cbiAgICAvL0lucHV0IGludGVyYWN0aW9uIG9wdGlvbnNcbiAgICBpbnB1dCA6IHtcbiAgICAgICAgZW5hYmxlTW91c2U6IGZhbHNlLFxuICAgICAgICBlbmFibGVLZXlib2FyZDogZmFsc2UsXG4gICAgICAgIC8vZW5hYmxlR2FtZXBhZDogZmFsc2UsXG4gICAgICAgIGVuYWJsZUFjY2VsZXJvbWV0ZXI6IGZhbHNlLFxuXG4gICAgICAgIG1vdXNlQ2hlY2tGcmVjdWVuY3k6IDMwLFxuICAgICAgICBkaXNhYmxlQ29udGV4dE1lbnU6IHRydWUsXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgfSxcblxuICAgIHBsdWdpbnMgOiBbXG4gICAgICAgIC8vSGVyZSB5b3VyIHBsdWdpbnMgbmFtZVxuICAgICAgICAvL1wibG9jYWxlXCIsXG4gICAgICAgIC8vXCJnYW1lcGFkXCJcbiAgICBdXG5cbn07IiwibW9kdWxlLmV4cG9ydHMgPSBQUS5DbGFzcy5leHRlbmQoe1xuICAgIF9pbml0OiBmdW5jdGlvbihnYW1lLCBvcHRpb25zKXtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnN8fHt9O1xuXG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG5cbiAgICAgICAgdGhpcy5taW5UaW1lID0gb3B0aW9ucy5taW5UaW1lIHx8IDYwMDA7XG4gICAgICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoIHx8IDE1MDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodCB8fCAxMjtcbiAgICAgICAgdGhpcy5jb2xvckluID0gdHlwZW9mIG9wdGlvbnMuY29sb3JJbiA9PT0gXCJudW1iZXJcIiA/IG9wdGlvbnMuY29sb3JJbiA6IDB4REJEQkRFO1xuICAgICAgICB0aGlzLmNvbG9yT3V0ID0gdHlwZW9mIG9wdGlvbnMuY29sb3JPdXQgPT09IFwibnVtYmVyXCIgPyBvcHRpb25zLmNvbG9yT3V0IDogMHhiMmIyYjI7XG4gICAgICAgIHRoaXMuYmdDb2xvciA9IHR5cGVvZiBvcHRpb25zLmJhY2tncm91bmRDb2xvciA9PT0gXCJudW1iZXJcIiA/IG9wdGlvbnMuYmFja2dyb3VuZENvbG9yIDogMHhmZmZmZmY7XG5cbiAgICAgICAgdGhpcy5nYW1lLnNjZW5lLnNldEJhY2tncm91bmRDb2xvcih0aGlzLmJnQ29sb3IpO1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmJhciA9IG5ldyBQUS5HcmFwaGljcygpO1xuICAgICAgICB0aGlzLmxvYWRlciA9IG5ldyBQUS5Bc3NldExvYWRlcigpO1xuXG4gICAgICAgIHRoaXMubG9nb1R3ZWVuID0gbnVsbDtcbiAgICAgICAgdGhpcy5iYXJUd2VlbiA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5yZWFkeSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuYXNzZXRzTnVtID0gMDtcbiAgICAgICAgdGhpcy50aW1lRm9yQXNzZXQgPSAwO1xuICAgICAgICB0aGlzLnByb2dyZXNzRm9yQXNzZXQgPSAwO1xuXG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgIH0sXG5cbiAgICBhZGQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMubG9hZGVyLmFkZC5hcHBseSh0aGlzLmxvYWRlciwgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGxvYWQ6IGZ1bmN0aW9uKGNhbGxiYWNrKXtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLl9zaG93TG9hZEJhcigpO1xuICAgICAgICB0aGlzLmxvYWRlci5vbignbG9hZCcsIHRoaXMuX2Fzc2V0TG9hZGVkLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLmxvYWRlci5sb2FkKCk7XG4gICAgfSxcblxuICAgIF9zaG93TG9hZEJhcjogZnVuY3Rpb24oKXtcbiAgICAgICAgLy9QZXJlbnF1ZW4uanMgbG9nb1xuICAgICAgICB2YXIgbG9nbyA9IG5ldyBQUS5TcHJpdGUoJ3BlcmVucXVlbmpzLWxvZ28nKVxuICAgICAgICAgICAgLnNldEFuY2hvcigwLjUsIDEpXG4gICAgICAgICAgICAuc2V0U2NhbGUoMC41KVxuICAgICAgICAgICAgLnNldFBvc2l0aW9uKHRoaXMuZ2FtZS5zY2VuZS53aWR0aC8yLCB0aGlzLmdhbWUuc2NlbmUuaGVpZ2h0LzIpXG4gICAgICAgICAgICAuYWRkVG8odGhpcy5nYW1lLnNjZW5lKTtcblxuICAgICAgICAvL1NpbXBsZSBsb2dvIGFuaW1hdGlvblxuICAgICAgICB0aGlzLmxvZ29Ud2VlbiA9IGxvZ28udHdlZW4oKS50byh7XG4gICAgICAgICAgICB5IDogbG9nby55KzVcbiAgICAgICAgfSkuc2V0RWFzaW5nKFBRLkVhc2luZy5vdXRTaW5lKCkpXG4gICAgICAgICAgICAuc2V0TG9vcCgpXG4gICAgICAgICAgICAuc2V0UGluZ1BvbmcoKVxuICAgICAgICAgICAgLnNldFRpbWUoMTUwMClcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIC8vQmFzaWMgbG9hZCBkYXRhXG4gICAgICAgIHRoaXMuYXNzZXRzTnVtID0gT2JqZWN0LmtleXModGhpcy5sb2FkZXIucmVzb3VyY2VzKS5sZW5ndGg7XG4gICAgICAgIHRoaXMudGltZUZvckFzc2V0ID0gdGhpcy5taW5UaW1lIC8gKHRoaXMuYXNzZXRzTnVtIHx8IDEpO1xuICAgICAgICB0aGlzLnByb2dyZXNzRm9yQXNzZXQgPSAxMDAgLyAodGhpcy5hc3NldHNOdW0gfHwgMSk7XG5cbiAgICAgICAgLy9EcmF3IGxvYWRiYXJcbiAgICAgICAgdGhpcy5iYXIuYmVnaW5GaWxsKHRoaXMuY29sb3JJbiwgMSlcbiAgICAgICAgICAgIC5kcmF3UmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcbiAgICAgICAgICAgIC5lbmRGaWxsKClcbiAgICAgICAgICAgIC5saW5lU3R5bGUoMywgdGhpcy5jb2xvck91dCwgMSlcbiAgICAgICAgICAgIC5kcmF3UmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcbiAgICAgICAgICAgIC5zZXRQb3NpdGlvbih0aGlzLmdhbWUuc2NlbmUud2lkdGgvMiAtIHRoaXMud2lkdGgvMiwgdGhpcy5nYW1lLnNjZW5lLmhlaWdodC8yICsgMjApXG4gICAgICAgICAgICAuYWRkVG8odGhpcy5nYW1lLnNjZW5lKTtcblxuICAgICAgICAvL0FkZCBwcm9ncmVzcyBhbmltYXRpb24gKGxpbmVhcikgd2l0aCBhIHR3ZWVuXG4gICAgICAgIHRoaXMuYmFyLl90b3RhbFByb2dyZXNzID0gMTtcblxuICAgICAgICB0aGlzLmJhclR3ZWVuID0gdGhpcy5iYXIudHdlZW4oKS50byh7XG4gICAgICAgICAgICBfdG90YWxQcm9ncmVzczogdGhpcy5wcm9ncmVzc0ZvckFzc2V0XG4gICAgICAgIH0pLnNldFRpbWUodGhpcy50aW1lRm9yQXNzZXQpXG4gICAgICAgICAgICAuc2V0RXhwaXJlKClcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIC8vUmUtZHJhdyBsb2FkYmFyXG4gICAgICAgIHZhciBzY29wZSA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmFyLnVwZGF0ZSA9IGZ1bmN0aW9uKGdhbWVUaW1lLCBkZWx0YSl7XG4gICAgICAgICAgICBpZihzY29wZS5yZWFkeSlyZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IChzY29wZS53aWR0aCAqIHRoaXMuX3RvdGFsUHJvZ3Jlc3MgLyAxMDApO1xuXG4gICAgICAgICAgICBpZihzY29wZS5jb3VudCA9PT0gc2NvcGUuYXNzZXRzTnVtICYmIHNjb3BlLmJhclR3ZWVuLmlzRW5kZWQpe1xuICAgICAgICAgICAgICAgIHNjb3BlLnJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzY29wZS5fY29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5iZWdpbkZpbGwoc2NvcGUuY29sb3JPdXQsIDEpXG4gICAgICAgICAgICAgICAgLmRyYXdSZWN0KDAsIDAsIHByb2dyZXNzLCBzY29wZS5oZWlnaHQpXG4gICAgICAgICAgICAgICAgLmVuZEZpbGwoKTtcbiAgICAgICAgfTtcblxuICAgIH0sXG5cbiAgICBfYXNzZXRMb2FkZWQ6IGZ1bmN0aW9uKGxvYWRlciwgcmVzb3VyY2Upe1xuICAgICAgICAvL0FkZCBhIG5ldyB0d2VlbiBmb3IgZWFjaCBhc3NldCBsb2FkZWRcbiAgICAgICAgdGhpcy5jb3VudCsrO1xuICAgICAgICBpZih0aGlzLmNvdW50IDwgdGhpcy5hc3NldHNOdW0pIHtcblxuICAgICAgICAgICAgaWYoIXRoaXMuYmFyVHdlZW4uaXNFbmRlZCkge1xuXG4gICAgICAgICAgICAgICAgLy9JZiBiYXJUd2VlbiBzdGlsbCBleGlzdHMsIGNoYWluIGl0IGEgbmV3IHR3ZWVuXG4gICAgICAgICAgICAgICAgdGhpcy5iYXJUd2VlbiA9IHRoaXMuYmFyVHdlZW4uY2hhaW4oKS50byh7XG4gICAgICAgICAgICAgICAgICAgIF90b3RhbFByb2dyZXNzOiB0aGlzLnByb2dyZXNzRm9yQXNzZXQgKiAodGhpcy5jb3VudCsxKVxuICAgICAgICAgICAgICAgIH0pLnNldFRpbWUodGhpcy50aW1lRm9yQXNzZXQpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRFeHBpcmUoKTtcbiAgICAgICAgICAgIH1lbHNle1xuXG4gICAgICAgICAgICAgICAgLy9pZiBiYXJUd2VlbiBpcyBleHBpcmVkLCBjcmVhdGUgYSBuZXcgdHdlZW5cbiAgICAgICAgICAgICAgICB0aGlzLmJhclR3ZWVuID0gdGhpcy5iYXIudHdlZW4oKS50byh7XG4gICAgICAgICAgICAgICAgICAgIF90b3RhbFByb2dyZXNzOiB0aGlzLnByb2dyZXNzRm9yQXNzZXQgKiAodGhpcy5jb3VudCsxKVxuICAgICAgICAgICAgICAgIH0pLnNldFRpbWUodGhpcy50aW1lRm9yQXNzZXQpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRFeHBpcmUoKVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jb21wbGV0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgaWYodGhpcy5jYWxsYmFjayl0aGlzLmNhbGxiYWNrKCk7XG5cbiAgICAgICAgLy9SZW1vdmUgdGhlIGxvZ28ncyB0d2VlbiAodGhpcyB0d2VlbiBkb24ndCBzdG9wIG5ldmVyLCBzbyBkb24ndCBleHBpcmUgbmV2ZXIuLi4pXG4gICAgICAgIHRoaXMubG9nb1R3ZWVuLnJlbW92ZSgpO1xuICAgIH1cbn0pOyIsInZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKSxcbiAgICBMb2FkQmFyID0gcmVxdWlyZSgnLi9Mb2FkQmFyJyksXG4gICAgTWFpblNjZW5lID0gcmVxdWlyZSgnLi9zY2VuZXMvTWFpblNjZW5lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUFEuQ2xhc3MuZXh0ZW5kKHtcbiAgICBfaW5pdDogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5nYW1lID0gbmV3IFBRLkdhbWUoY29uZmlnKTtcbiAgICAgICAgdGhpcy5nYW1lLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuX2xvYWRMb2dvKCk7XG4gICAgfSxcblxuICAgIF9sb2FkTG9nbzogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5nYW1lLmFzc2V0TG9hZGVyLmFkZChbXG4gICAgICAgICAgICB7dXJsOiBcIi4vYXNzZXRzL2ltYWdlcy9wZXJlbnF1ZW5qcy1sb2dvLnBuZ1wiLCBuYW1lOiBcInBlcmVucXVlbmpzLWxvZ29cIn1cbiAgICAgICAgXSkubG9hZCh0aGlzLl9sb2FkQXNzZXRzLmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBfbG9hZEFzc2V0czogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGxvYWRCYXIgPSBuZXcgTG9hZEJhcih0aGlzLmdhbWUsIHtcblxuICAgICAgICAgICAgLy9EYXJrIHN0eWxlXG4gICAgICAgICAgICBtaW5UaW1lIDogNjAwMCxcbiAgICAgICAgICAgIHdpZHRoIDogMTUwLFxuICAgICAgICAgICAgaGVpZ2h0IDogMTIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IDB4MDAwMDAwLFxuICAgICAgICAgICAgY29sb3JPdXQ6IDB4ZmZmZmZmLFxuICAgICAgICAgICAgY29sb3JJbjogMHhjMGMwYzBcblxuICAgICAgICB9KTtcblxuXG4gICAgICAgIGxvYWRCYXIuYWRkKFtcbiAgICAgICAgICAgIC8vYWRkIHlvdXIgYXNzZXRzIGhlcmUgdG8gbG9hZCB0aGVtXG4gICAgICAgICAgICAvL2V4YW1wbGUge25hbWU6IFwibG9nb1wiLCB1cmw6IFwibG9nb3VybC5wbmdcIn1cbiAgICAgICAgICAgIC8vZXhhbXBsZSB7dXJsIDogXCJwYWNrYWdlLmpzb25cIn1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgbG9hZEJhci5sb2FkKHRoaXMub25Bc3NldHNMb2FkZWQuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG9uQXNzZXRzTG9hZGVkOiBmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZygnQWxsIGFzc2V0cyBsb2FkZWQhJyk7XG4gICAgICAgIC8vQ3JlYXRlIGFuZCBhZGQgYSBjdXN0b20gc2NlbmVcbiAgICAgICAgdmFyIG1haW5TY2VuZSA9IG5ldyBNYWluU2NlbmUodGhpcy5nYW1lKTtcbiAgICAgICAgdGhpcy5nYW1lLnNjZW5lTWFuYWdlci5hZGRTY2VuZShtYWluU2NlbmUpO1xuXG4gICAgICAgIC8vUmVuZGVyIHRoaXMgc2NlbmUgbm93XG4gICAgICAgIHRoaXMuZ2FtZS5zY2VuZU1hbmFnZXIuc2V0Q3VycmVudFNjZW5lKG1haW5TY2VuZSk7XG4gICAgfVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBQUS5TY2VuZS5leHRlbmQoe1xuICAgX2luaXQ6IGZ1bmN0aW9uKGdhbWUpe1xuICAgICAgIHRoaXMuX3N1cGVyKGdhbWUpO1xuICAgICAgIHRoaXMuaWQgPSBcIm1haW5TY2VuZVwiO1xuXG4gICAgICAgLy9SZW1vdmUgdGhpcyBeXlxuICAgICAgIHRoaXMuc2hvd1dlbGNvbWUoKTtcbiAgIH0sXG5cbiAgICBzaG93V2VsY29tZTogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHRleHQgPSBuZXcgUFEuVGV4dCgnSGVsbG8gd29ybGQhIScsIHtcbiAgICAgICAgICAgIGZvbnQ6IFwiMzBweCBBcmlhbFwiLFxuICAgICAgICAgICAgZmlsbDogMHhmZmZmZmZcbiAgICAgICAgfSkuc2V0UG9zaXRpb24odGhpcy53aWR0aC8yLCB0aGlzLmhlaWdodC8yKVxuICAgICAgICAgICAgLmFkZFRvKHRoaXMpO1xuICAgIH1cbn0pOyJdfQ==
