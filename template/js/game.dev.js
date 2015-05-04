(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//window.PQ = require('perenquenjs');

var config = require('./config'),
    plugin = require('./Plugin'),
    Main = require('./game/Main');

plugin.enable(config.plugins);

PQ.config.useDeltaAnimation = config.useDeltaAnimation;
PQ.config.useSortChildrenByDepth = config.useSortChildrenByDepth;

module.exports = new Main();
},{"./Plugin":2,"./config":3,"./game/Main":5}],2:[function(require,module,exports){
var path = "./plugins/";

function Plugin(){
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
    useSortChildrenByDepth: true,

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
        this.minTime = options.minTime || 10000;
        this.width = options.width || 300;
        this.height = options.height || 40;

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
        this._showLogo();
        this.loader.on('load', this._assetLoaded.bind(this));
        this.loader.load();
    },

    _showLogo: function(){
        var logo = new PQ.Sprite('perenquenjs-logo')
            .setAnchor(0.5, 1)
            .setPosition(this.game.scene.width/2, this.game.scene.height/2)
            .addTo(this.game.scene);

        //Simple animation
        this.logoTween = logo.tween().to({
            y : logo.y+5
        }).setEasing(PQ.Easing.outSine())
            .setLoop()
            .setPingPong()
            .setTime(1500)
            .start();

        this.assetsNum = Object.keys(this.loader.resources).length;
        this.timeForAsset = this.minTime / (this.assetsNum || 1);
        this.progressForAsset = 100 / (this.assetsNum || 1);

        //Draw loadbar
        this.bar.beginFill(0xb2b2b2, 1)
            .drawRect(0, 0, this.width, this.height)
            .endFill()
            .lineStyle(3, 0xffffff, 1)
            .drawRect(0, 0, this.width, this.height)
            .setPosition(this.game.scene.width/2 - this.width/2, this.game.scene.height/2 + 50)
            .addTo(this.game.scene);

        //Add progress animation (linear)
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

            this.beginFill(0xffffff, 1)
                .drawRect(0, 0, progress, scope.height)
                .endFill();
        };

    },

    _assetLoaded: function(loader, resource){
        this.count++;
        if(this.count < this.assetsNum) {

            if(!this.barTween.isEnded) {
                this.barTween = this.barTween.chain().to({
                    _totalProgress: this.progressForAsset * (this.count+1)
                }).setTime(this.timeForAsset)
                    .setExpire();
            }else{
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
},{"../config":3,"./LoadBar":4,"./scenes/MainScene":6}],6:[function(require,module,exports){
module.exports = PQ.Scene.extend({
   _init: function(game){
       this._super(game);
       this.id = "mainScene";

       //Remove this ^^
       this.showWelcome();
   },

    showWelcome: function(){
        var text = new PQ.Text('Your Main Scene...', {
            font: "30px Arial",
            fill: 0xffffff
        }).setPosition(this.width/2, this.height/2)
            .addTo(this);
    }
});
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvUGx1Z2luLmpzIiwic3JjL2NvbmZpZy5qcyIsInNyYy9nYW1lL0xvYWRCYXIuanMiLCJzcmMvZ2FtZS9NYWluLmpzIiwic3JjL2dhbWUvc2NlbmVzL01haW5TY2VuZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL3dpbmRvdy5QUSA9IHJlcXVpcmUoJ3BlcmVucXVlbmpzJyk7XG5cbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpLFxuICAgIHBsdWdpbiA9IHJlcXVpcmUoJy4vUGx1Z2luJyksXG4gICAgTWFpbiA9IHJlcXVpcmUoJy4vZ2FtZS9NYWluJyk7XG5cbnBsdWdpbi5lbmFibGUoY29uZmlnLnBsdWdpbnMpO1xuXG5QUS5jb25maWcudXNlRGVsdGFBbmltYXRpb24gPSBjb25maWcudXNlRGVsdGFBbmltYXRpb247XG5QUS5jb25maWcudXNlU29ydENoaWxkcmVuQnlEZXB0aCA9IGNvbmZpZy51c2VTb3J0Q2hpbGRyZW5CeURlcHRoO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBNYWluKCk7IiwidmFyIHBhdGggPSBcIi4vcGx1Z2lucy9cIjtcblxuZnVuY3Rpb24gUGx1Z2luKCl7XG4gICAgdGhpcy5lbmFibGUgPSBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgICAgaWYodHlwZW9mIHBsdWdpbnMgPT09IFwic3RyaW5nXCIpcGx1Z2lucyA9IFtwbHVnaW5zXTtcbiAgICAgICAgdmFyIGxlbiA9IHBsdWdpbnMubGVuZ3RoO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICAgICAgdmFyIHVybCA9IHBhdGggKyBwbHVnaW5zW2ldICsgXCIuanNcIjtcbiAgICAgICAgICAgIHJlcXVpcmUodXJsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFBRLnBsdWdpbi5lbmFibGUocGx1Z2lucyk7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgUGx1Z2luKCk7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLy9HYW1lJ3MgaWQsIHVzZXMgdG8gc2F2ZSBkYXRhIGF0IGxvY2Fsc3RvcmFnZVxuICAgIGlkOiAncHEuZGVmYXVsdGJ1bmRsZS5pZCcsXG5cbiAgICAvL1ZlcnNpb24gb2YgdGhpcyBnYW1lLCBhbHNvIHVzZXMgaW4gbG9jYWxzdG9yYWdlIG1ldGFkYXRhXG4gICAgdmVyc2lvbjogXCIwLjAuMFwiLFxuXG4gICAgLy9BY3RpdmF0ZSBkZWJ1ZyBtb2RlLCB0byBzaG93IGJvdW5kcywgZXRjLi4uXG4gICAgZGVidWc6IGZhbHNlLFxuXG4gICAgLy9Mb2cgb3V0IHRoZSBwZXJlbnF1ZW4ncyBuYW1lLCB2ZXJzaW9uLCBhbmQgd2ViXG4gICAgc2F5SGVsbG86IHRydWUsXG5cbiAgICAvL1NwZWVkIGFuZCByb3RhdGlvbiBzcGVlZCB1c2UgZGVsdGEgdGltZVxuICAgIHVzZURlbHRhQW5pbWF0aW9uOiB0cnVlLFxuXG4gICAgLy9BdXRvIHNvcnQgY2hpbGRyZW4gd2hlbiB0aGV5IGFyZSBhZGRlZCB0byBoaXMgcGFyZW50LCAoaWYgaXQncyBmYWxzZSwgeW91IGNhbiBzb3J0IG1hbnVhbGx5IHdpdGggY29udGFpbmVyLnNvcnRDaGlsZHJlbkJ5SWQoKSlcbiAgICB1c2VTb3J0Q2hpbGRyZW5CeURlcHRoOiB0cnVlLFxuXG4gICAgLy9HYW1lIG9wdGlvbnNcbiAgICBnYW1lIDoge1xuXG4gICAgICAgIC8vUmVuZGVyZXIgd2lkdGhcbiAgICAgICAgd2lkdGg6IDgwMCxcblxuICAgICAgICAvL1JlbmRlcmVyIGhlaWdodFxuICAgICAgICBoZWlnaHQ6IDYwMCxcblxuICAgICAgICAvL1RoZSByZXNvbHV0aW9uIG9mIHRoZSByZW5kZXJlciwgdXNlZCB0byBzY2FsZSBpbiByZXRpbmEgZGV2aWNlc1xuICAgICAgICByZXNvbHV0aW9uOiAxLFxuXG4gICAgICAgIC8vVGhlIGNhbnZhcyB0byB1c2UgYXMgYSB2aWV3LCAoYnkgZGVmYXVsdCBwZXJlbnF1ZW4gY3JlYXRlcyBvbmUpXG4gICAgICAgIGNhbnZhczogbnVsbCxcblxuICAgICAgICAvL0NvbG9yIHVzZWQgbGlrZSBhIHJlbmRlcmVyJ3MgYmFja2dyb3VuZCwgKDB4MDAwMDAwIGJ5IGRlZmF1bHQpXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogMHgwMDAwMDAsXG5cbiAgICAgICAgLy9JZiB0aGUgcmVuZGVyIHZpZXcgaXMgdHJhbnNwYXJlbnQsIGRlZmF1bHQgZmFsc2VcbiAgICAgICAgdHJhbnNwYXJlbnRCYWNrZ3JvdW5kOiBmYWxzZSxcblxuICAgICAgICAvL1NldHMgYW50aWFsaWFzIChvbmx5IGFwcGxpY2FibGUgaW4gY2hyb21lIGF0IHRoZSBtb21lbnQpXG4gICAgICAgIHVzZUFudGlhbGlhczogZmFsc2UsXG5cbiAgICAgICAgLy9Vc2UgdGhlIFdlYkdMIHJlbmRlcmVyIGFsd2F5cyBpdCdzIGF2YWlsYWJsZVxuICAgICAgICB1c2VXZWJHTDogdHJ1ZSxcblxuICAgICAgICAvL2VuYWJsZXMgZHJhd2luZyBidWZmZXIgcHJlc2VydmF0aW9uLCBlbmFibGUgdGhpcyBpZiB5b3UgbmVlZCB0byBjYWxsIHRvRGF0YVVybCBvbiB0aGUgd2ViZ2wgY29udGV4dFxuICAgICAgICBwcmVzZXJ2ZURyYXdpbmdCdWZmZXI6IGZhbHNlLFxuXG4gICAgICAgIC8vVXNlIGxvY2FsU3RvcmFnZSB0byBzYXZlIGFsbCB5b3UgbmVlZCB3aXRoIGRhdGFNYW5hZ2VyLCBpZiBpdCdzIGZhbHNlLCB0aGUgZGF0YSBqdXN0IGRlbGV0ZSBhdCByZWZyZXNoXG4gICAgICAgIHVzZVBlcnNpdGFudERhdGE6IGZhbHNlLFxuXG4gICAgICAgIC8vU2NyZWVuIHNjYWxlIGJlaGF2aW9yIHdoZW4gdGhlIGNhbnZhcyBzaXplIGlzIGRpZmZlcmVudCB0byB0aGUgd2luZG93IHNpemUsIGRlZmF1bHQgR0FNRV9TQ0FMRV9UWVBFLk5PTkVcbiAgICAgICAgc2NhbGVUeXBlOiBQUS5HQU1FX1NDQUxFX1RZUEUuTk9ORSxcblxuICAgICAgICAvL0lmIHRoZSBwZXJmb3JtYW5jZSBpcyBwb29yLCB0aGUgdGltZSBiZXR3ZWVuIGZyYW1lcyBuZXZlciB3aWxsIGdvIG1vcmUgc2xvd2x5IHRoYW4gdGhpc1xuICAgICAgICBtaW5GcmFtZUxpbWl0OiAzMCxcblxuICAgICAgICAvL1BhdXNlIHRoZSBnYW1lIHdoZW4gaXQgbG9zdCB0aGUgZm9jdXMsIChleGFtcGxlOiB3aGVuIHlvdSBjaGFuZ2UgdGhlIGJyb3dzZXIncyB0YWIpIGRlZmF1bHQgdHJ1ZVxuICAgICAgICBzdG9wQXRWaXNpYmlsdHlDaGFuZ2U6IHRydWUsXG5cbiAgICAgICAgLy9UaGlzIHNldHMgaWYgdGhlIENhbnZhc1JlbmRlcmVyIHdpbGwgY2xlYXIgdGhlIGNhbnZhcyBvciBub3QgYmVmb3JlIHRoZSBuZXcgcmVuZGVyIHBhc3MuXG4gICAgICAgIGNsZWFyQmVmb3JlUmVuZGVyOiB0cnVlXG5cbiAgICB9LFxuXG4gICAgLy9BdWRpbyBvcHRpb25zXG4gICAgYXVkaW8gOiB7XG5cbiAgICAgICAgLy9Vc2UgdGhlIFdlYkF1ZGlvIEFQSSBhbHdheXMgaXQncyBhdmFpbGFibGVcbiAgICAgICAgdXNlV2ViQXVkaW86IHRydWUsXG5cbiAgICAgICAgLy9Gb3JjZSB0aGUgbG9hZGVyIHRvIGxvYWQgYXVkaW8gZmlsZXMgaW4gdGhpcyBvcmRlclxuICAgICAgICBhbGxvd2VkRXh0ZW5zaW9uczogW1wibXAzXCIsIFwib2dnXCIsIFwid2F2XCJdXG4gICAgfSxcblxuICAgIC8vSW5wdXQgaW50ZXJhY3Rpb24gb3B0aW9uc1xuICAgIGlucHV0IDoge1xuICAgICAgICBlbmFibGVNb3VzZTogZmFsc2UsXG4gICAgICAgIGVuYWJsZUtleWJvYXJkOiBmYWxzZSxcbiAgICAgICAgLy9lbmFibGVHYW1lcGFkOiBmYWxzZSxcbiAgICAgICAgZW5hYmxlQWNjZWxlcm9tZXRlcjogZmFsc2UsXG5cbiAgICAgICAgbW91c2VDaGVja0ZyZWN1ZW5jeTogMzAsXG4gICAgICAgIGRpc2FibGVDb250ZXh0TWVudTogdHJ1ZSxcbiAgICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICB9LFxuXG4gICAgcGx1Z2lucyA6IFtcbiAgICAgICAgLy9IZXJlIHlvdXIgcGx1Z2lucyBuYW1lXG4gICAgICAgIC8vXCJsb2NhbGVcIixcbiAgICAgICAgLy9cImdhbWVwYWRcIlxuICAgIF1cblxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IFBRLkNsYXNzLmV4dGVuZCh7XG4gICAgX2luaXQ6IGZ1bmN0aW9uKGdhbWUsIG9wdGlvbnMpe1xuICAgICAgICBvcHRpb25zID0gb3B0aW9uc3x8e307XG5cbiAgICAgICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgICAgICAgdGhpcy5taW5UaW1lID0gb3B0aW9ucy5taW5UaW1lIHx8IDEwMDAwO1xuICAgICAgICB0aGlzLndpZHRoID0gb3B0aW9ucy53aWR0aCB8fCAzMDA7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgNDA7XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG4gICAgICAgIHRoaXMuYmFyID0gbmV3IFBRLkdyYXBoaWNzKCk7XG4gICAgICAgIHRoaXMubG9hZGVyID0gbmV3IFBRLkFzc2V0TG9hZGVyKCk7XG5cbiAgICAgICAgdGhpcy5sb2dvVHdlZW4gPSBudWxsO1xuICAgICAgICB0aGlzLmJhclR3ZWVuID0gbnVsbDtcblxuICAgICAgICB0aGlzLnJlYWR5ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5hc3NldHNOdW0gPSAwO1xuICAgICAgICB0aGlzLnRpbWVGb3JBc3NldCA9IDA7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3NGb3JBc3NldCA9IDA7XG5cbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgfSxcblxuICAgIGFkZDogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5sb2FkZXIuYWRkLmFwcGx5KHRoaXMubG9hZGVyLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgbG9hZDogZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuX3Nob3dMb2dvKCk7XG4gICAgICAgIHRoaXMubG9hZGVyLm9uKCdsb2FkJywgdGhpcy5fYXNzZXRMb2FkZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMubG9hZGVyLmxvYWQoKTtcbiAgICB9LFxuXG4gICAgX3Nob3dMb2dvOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgbG9nbyA9IG5ldyBQUS5TcHJpdGUoJ3BlcmVucXVlbmpzLWxvZ28nKVxuICAgICAgICAgICAgLnNldEFuY2hvcigwLjUsIDEpXG4gICAgICAgICAgICAuc2V0UG9zaXRpb24odGhpcy5nYW1lLnNjZW5lLndpZHRoLzIsIHRoaXMuZ2FtZS5zY2VuZS5oZWlnaHQvMilcbiAgICAgICAgICAgIC5hZGRUbyh0aGlzLmdhbWUuc2NlbmUpO1xuXG4gICAgICAgIC8vU2ltcGxlIGFuaW1hdGlvblxuICAgICAgICB0aGlzLmxvZ29Ud2VlbiA9IGxvZ28udHdlZW4oKS50byh7XG4gICAgICAgICAgICB5IDogbG9nby55KzVcbiAgICAgICAgfSkuc2V0RWFzaW5nKFBRLkVhc2luZy5vdXRTaW5lKCkpXG4gICAgICAgICAgICAuc2V0TG9vcCgpXG4gICAgICAgICAgICAuc2V0UGluZ1BvbmcoKVxuICAgICAgICAgICAgLnNldFRpbWUoMTUwMClcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIHRoaXMuYXNzZXRzTnVtID0gT2JqZWN0LmtleXModGhpcy5sb2FkZXIucmVzb3VyY2VzKS5sZW5ndGg7XG4gICAgICAgIHRoaXMudGltZUZvckFzc2V0ID0gdGhpcy5taW5UaW1lIC8gKHRoaXMuYXNzZXRzTnVtIHx8IDEpO1xuICAgICAgICB0aGlzLnByb2dyZXNzRm9yQXNzZXQgPSAxMDAgLyAodGhpcy5hc3NldHNOdW0gfHwgMSk7XG5cbiAgICAgICAgLy9EcmF3IGxvYWRiYXJcbiAgICAgICAgdGhpcy5iYXIuYmVnaW5GaWxsKDB4YjJiMmIyLCAxKVxuICAgICAgICAgICAgLmRyYXdSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KVxuICAgICAgICAgICAgLmVuZEZpbGwoKVxuICAgICAgICAgICAgLmxpbmVTdHlsZSgzLCAweGZmZmZmZiwgMSlcbiAgICAgICAgICAgIC5kcmF3UmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcbiAgICAgICAgICAgIC5zZXRQb3NpdGlvbih0aGlzLmdhbWUuc2NlbmUud2lkdGgvMiAtIHRoaXMud2lkdGgvMiwgdGhpcy5nYW1lLnNjZW5lLmhlaWdodC8yICsgNTApXG4gICAgICAgICAgICAuYWRkVG8odGhpcy5nYW1lLnNjZW5lKTtcblxuICAgICAgICAvL0FkZCBwcm9ncmVzcyBhbmltYXRpb24gKGxpbmVhcilcbiAgICAgICAgdGhpcy5iYXIuX3RvdGFsUHJvZ3Jlc3MgPSAxO1xuXG4gICAgICAgIHRoaXMuYmFyVHdlZW4gPSB0aGlzLmJhci50d2VlbigpLnRvKHtcbiAgICAgICAgICAgIF90b3RhbFByb2dyZXNzOiB0aGlzLnByb2dyZXNzRm9yQXNzZXRcbiAgICAgICAgfSkuc2V0VGltZSh0aGlzLnRpbWVGb3JBc3NldClcbiAgICAgICAgICAgIC5zZXRFeHBpcmUoKVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG5cbiAgICAgICAgLy9SZS1kcmF3IGxvYWRiYXJcbiAgICAgICAgdmFyIHNjb3BlID0gdGhpcztcbiAgICAgICAgdGhpcy5iYXIudXBkYXRlID0gZnVuY3Rpb24oZ2FtZVRpbWUsIGRlbHRhKXtcbiAgICAgICAgICAgIGlmKHNjb3BlLnJlYWR5KXJldHVybjtcblxuICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gKHNjb3BlLndpZHRoICogdGhpcy5fdG90YWxQcm9ncmVzcyAvIDEwMCk7XG5cbiAgICAgICAgICAgIGlmKHNjb3BlLmNvdW50ID09PSBzY29wZS5hc3NldHNOdW0gJiYgc2NvcGUuYmFyVHdlZW4uaXNFbmRlZCl7XG4gICAgICAgICAgICAgICAgc2NvcGUucmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNjb3BlLl9jb21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmJlZ2luRmlsbCgweGZmZmZmZiwgMSlcbiAgICAgICAgICAgICAgICAuZHJhd1JlY3QoMCwgMCwgcHJvZ3Jlc3MsIHNjb3BlLmhlaWdodClcbiAgICAgICAgICAgICAgICAuZW5kRmlsbCgpO1xuICAgICAgICB9O1xuXG4gICAgfSxcblxuICAgIF9hc3NldExvYWRlZDogZnVuY3Rpb24obG9hZGVyLCByZXNvdXJjZSl7XG4gICAgICAgIHRoaXMuY291bnQrKztcbiAgICAgICAgaWYodGhpcy5jb3VudCA8IHRoaXMuYXNzZXRzTnVtKSB7XG5cbiAgICAgICAgICAgIGlmKCF0aGlzLmJhclR3ZWVuLmlzRW5kZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJhclR3ZWVuID0gdGhpcy5iYXJUd2Vlbi5jaGFpbigpLnRvKHtcbiAgICAgICAgICAgICAgICAgICAgX3RvdGFsUHJvZ3Jlc3M6IHRoaXMucHJvZ3Jlc3NGb3JBc3NldCAqICh0aGlzLmNvdW50KzEpXG4gICAgICAgICAgICAgICAgfSkuc2V0VGltZSh0aGlzLnRpbWVGb3JBc3NldClcbiAgICAgICAgICAgICAgICAgICAgLnNldEV4cGlyZSgpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgdGhpcy5iYXJUd2VlbiA9IHRoaXMuYmFyLnR3ZWVuKCkudG8oe1xuICAgICAgICAgICAgICAgICAgICBfdG90YWxQcm9ncmVzczogdGhpcy5wcm9ncmVzc0ZvckFzc2V0ICogKHRoaXMuY291bnQrMSlcbiAgICAgICAgICAgICAgICB9KS5zZXRUaW1lKHRoaXMudGltZUZvckFzc2V0KVxuICAgICAgICAgICAgICAgICAgICAuc2V0RXhwaXJlKClcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfY29tcGxldGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKHRoaXMuY2FsbGJhY2spdGhpcy5jYWxsYmFjaygpO1xuICAgICAgICB0aGlzLmxvZ29Ud2Vlbi5yZW1vdmUoKTtcbiAgICB9XG59KTsiLCJ2YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyksXG4gICAgTG9hZEJhciA9IHJlcXVpcmUoJy4vTG9hZEJhcicpLFxuICAgIE1haW5TY2VuZSA9IHJlcXVpcmUoJy4vc2NlbmVzL01haW5TY2VuZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBRLkNsYXNzLmV4dGVuZCh7XG4gICAgX2luaXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZ2FtZSA9IG5ldyBQUS5HYW1lKGNvbmZpZyk7XG4gICAgICAgIHRoaXMuZ2FtZS5zdGFydCgpO1xuICAgICAgICB0aGlzLl9sb2FkTG9nbygpO1xuICAgIH0sXG5cbiAgICBfbG9hZExvZ286IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZ2FtZS5hc3NldExvYWRlci5hZGQoW1xuICAgICAgICAgICAge3VybDogXCIuL2Fzc2V0cy9pbWFnZXMvcGVyZW5xdWVuanMtbG9nby5wbmdcIiwgbmFtZTogXCJwZXJlbnF1ZW5qcy1sb2dvXCJ9XG4gICAgICAgIF0pLmxvYWQodGhpcy5fbG9hZEFzc2V0cy5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgX2xvYWRBc3NldHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBsb2FkQmFyID0gbmV3IExvYWRCYXIodGhpcy5nYW1lLCB7XG4gICAgICAgICAgICBtaW5UaW1lIDogNTAwMCxcbiAgICAgICAgICAgIHdpZHRoIDogMzAwLFxuICAgICAgICAgICAgaGVpZ2h0IDogNDBcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBsb2FkQmFyLmFkZChbXG4gICAgICAgICAgICAvL2FkZCB5b3VyIGFzc2V0cyBoZXJlIHRvIGxvYWQgdGhlbVxuICAgICAgICAgICAgLy9leGFtcGxlIHtuYW1lOiBcImxvZ29cIiwgdXJsOiBcImxvZ291cmwucG5nXCJ9XG4gICAgICAgICAgICAvL2V4YW1wbGUge3VybCA6IFwicGFja2FnZS5qc29uXCJ9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIGxvYWRCYXIubG9hZCh0aGlzLm9uQXNzZXRzTG9hZGVkLmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBvbkFzc2V0c0xvYWRlZDogZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2coJ0FsbCBhc3NldHMgbG9hZGVkIScpO1xuICAgICAgICB2YXIgbWFpblNjZW5lID0gbmV3IE1haW5TY2VuZSh0aGlzLmdhbWUpO1xuICAgICAgICB0aGlzLmdhbWUuc2NlbmVNYW5hZ2VyLmFkZFNjZW5lKG1haW5TY2VuZSk7XG4gICAgICAgIHRoaXMuZ2FtZS5zY2VuZU1hbmFnZXIuc2V0Q3VycmVudFNjZW5lKG1haW5TY2VuZSk7XG4gICAgfVxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBQUS5TY2VuZS5leHRlbmQoe1xuICAgX2luaXQ6IGZ1bmN0aW9uKGdhbWUpe1xuICAgICAgIHRoaXMuX3N1cGVyKGdhbWUpO1xuICAgICAgIHRoaXMuaWQgPSBcIm1haW5TY2VuZVwiO1xuXG4gICAgICAgLy9SZW1vdmUgdGhpcyBeXlxuICAgICAgIHRoaXMuc2hvd1dlbGNvbWUoKTtcbiAgIH0sXG5cbiAgICBzaG93V2VsY29tZTogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHRleHQgPSBuZXcgUFEuVGV4dCgnWW91ciBNYWluIFNjZW5lLi4uJywge1xuICAgICAgICAgICAgZm9udDogXCIzMHB4IEFyaWFsXCIsXG4gICAgICAgICAgICBmaWxsOiAweGZmZmZmZlxuICAgICAgICB9KS5zZXRQb3NpdGlvbih0aGlzLndpZHRoLzIsIHRoaXMuaGVpZ2h0LzIpXG4gICAgICAgICAgICAuYWRkVG8odGhpcyk7XG4gICAgfVxufSk7Il19
