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

    //Version of this game, also uses in localstorage metada
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
        gameScaleType: PQ.GAME_SCALE_TYPE.NONE,

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

        this.ready = false;
    },

    add: function(){
        this.loader.add.apply(this.loader, arguments);
        return this;
    },

    load: function(callback){
        this.callback = callback;
        this._showLogo();
        this.loader.load();
    },

    _showLogo: function(){
        var logo = new PQ.Sprite('perenquenjs-logo')
            .setAnchor(0.5, 1)
            .setPosition(this.game.scene.width/2, this.game.scene.height/2)
            .addTo(this.game.scene);


        //Simple animation
        var logoTween = logo.tween().to({
            y : logo.y+5
        }).setEasing(PQ.Easing.outSine())
            .setLoop()
            .setPingPong()
            .setTime(1500)
            .start();

        this.bar.lineStyle(3, 0xffffff, 1)
            .drawRoundedRect(0, 0, this.width, this.height, 10)
            .setPosition(this.game.scene.width/2 - this.width/2, this.game.scene.height/2 + 50)
            .addTo(this.game.scene);

        this.bar._totalProgress = 21; //Min roundRect = radius*2 +1

        //Add progress animation (linear)
        var barTween = this.bar.tween().to({
            _totalProgress: 85
        }).setTime(this.minTime)
            .start();

        //TODO: Load effect when don't have nothing to load
        var nothingToLoad = !(!!Object.keys(this.loader.resources).length);

        //Fake load bar effect
        var scope = this;
        this.bar.update = function(gameTime, delta){
            if(scope.ready)return;

            var loadProgress = scope.loader.progress,
                tweenEnded = barTween.isEnded,
                progress = (scope.width * this._totalProgress / 100);

            if(progress < 21){
                progress = 21;
            }else if(tweenEnded){
                if(loadProgress === 100 && this._totalProgress !== loadProgress){
                    barTween.reset()
                        .from({
                            _totalProgress : this._totalProgress
                        })
                        .to({
                            _totalProgress : 100
                        }).setTime(500)
                        .start();
                }else if(loadProgress === 100 && this._totalProgress === 100){
                    scope.ready = true;
                    scope._complete();
                }
            }

            this.clear()
                .beginFill(0xffffff, 0.7)
                .drawRoundedRect(0, 0, progress, scope.height, 10)
                .endFill()
                .lineStyle(3, 0xffffff, 1)
                .drawRoundedRect(0, 0, scope.width, scope.height, 10);
        };

    },

    _complete: function(){
        //TODO: Remove tweens
        if(this.callback)this.callback();
    }
});
},{}],5:[function(require,module,exports){
var config = require('../config'),
    LoadBar = require('./LoadBar');

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
            height : 50
        });


        loadBar.add([
            //add your assets here

            //{url : "package.json"}
        ]);

        loadBar.load(this.onAssetsLoaded.bind(this));
    },

    onAssetsLoaded: function(){
        console.log('All assets loaded!');
    }
});
},{"../config":3,"./LoadBar":4}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvUGx1Z2luLmpzIiwic3JjL2NvbmZpZy5qcyIsInNyYy9nYW1lL0xvYWRCYXIuanMiLCJzcmMvZ2FtZS9NYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vd2luZG93LlBRID0gcmVxdWlyZSgncGVyZW5xdWVuanMnKTtcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyksXG4gICAgcGx1Z2luID0gcmVxdWlyZSgnLi9QbHVnaW4nKSxcbiAgICBNYWluID0gcmVxdWlyZSgnLi9nYW1lL01haW4nKTtcblxucGx1Z2luLmVuYWJsZShjb25maWcucGx1Z2lucyk7XG5cblBRLmNvbmZpZy51c2VEZWx0YUFuaW1hdGlvbiA9IGNvbmZpZy51c2VEZWx0YUFuaW1hdGlvbjtcblBRLmNvbmZpZy51c2VTb3J0Q2hpbGRyZW5CeURlcHRoID0gY29uZmlnLnVzZVNvcnRDaGlsZHJlbkJ5RGVwdGg7XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IE1haW4oKTsiLCJ2YXIgcGF0aCA9IFwiLi9wbHVnaW5zL1wiO1xuXG5mdW5jdGlvbiBQbHVnaW4oKXtcbiAgICB0aGlzLmVuYWJsZSA9IGZ1bmN0aW9uKHBsdWdpbnMpe1xuICAgICAgICBpZih0eXBlb2YgcGx1Z2lucyA9PT0gXCJzdHJpbmdcIilwbHVnaW5zID0gW3BsdWdpbnNdO1xuICAgICAgICB2YXIgbGVuID0gcGx1Z2lucy5sZW5ndGg7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgICAgICB2YXIgdXJsID0gcGF0aCArIHBsdWdpbnNbaV0gKyBcIi5qc1wiO1xuICAgICAgICAgICAgcmVxdWlyZSh1cmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgUFEucGx1Z2luLmVuYWJsZShwbHVnaW5zKTtcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBQbHVnaW4oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvL0dhbWUncyBpZCwgdXNlcyB0byBzYXZlIGRhdGEgYXQgbG9jYWxzdG9yYWdlXG4gICAgaWQ6ICdwcS5kZWZhdWx0YnVuZGxlLmlkJyxcblxuICAgIC8vVmVyc2lvbiBvZiB0aGlzIGdhbWUsIGFsc28gdXNlcyBpbiBsb2NhbHN0b3JhZ2UgbWV0YWRhXG4gICAgdmVyc2lvbjogXCIwLjAuMFwiLFxuXG4gICAgLy9BY3RpdmF0ZSBkZWJ1ZyBtb2RlLCB0byBzaG93IGJvdW5kcywgZXRjLi4uXG4gICAgZGVidWc6IGZhbHNlLFxuXG4gICAgLy9Mb2cgb3V0IHRoZSBwZXJlbnF1ZW4ncyBuYW1lLCB2ZXJzaW9uLCBhbmQgd2ViXG4gICAgc2F5SGVsbG86IHRydWUsXG5cbiAgICAvL1NwZWVkIGFuZCByb3RhdGlvbiBzcGVlZCB1c2UgZGVsdGEgdGltZVxuICAgIHVzZURlbHRhQW5pbWF0aW9uOiB0cnVlLFxuXG4gICAgLy9BdXRvIHNvcnQgY2hpbGRyZW4gd2hlbiB0aGV5IGFyZSBhZGRlZCB0byBoaXMgcGFyZW50LCAoaWYgaXQncyBmYWxzZSwgeW91IGNhbiBzb3J0IG1hbnVhbGx5IHdpdGggY29udGFpbmVyLnNvcnRDaGlsZHJlbkJ5SWQoKSlcbiAgICB1c2VTb3J0Q2hpbGRyZW5CeURlcHRoOiB0cnVlLFxuXG4gICAgLy9HYW1lIG9wdGlvbnNcbiAgICBnYW1lIDoge1xuXG4gICAgICAgIC8vUmVuZGVyZXIgd2lkdGhcbiAgICAgICAgd2lkdGg6IDgwMCxcblxuICAgICAgICAvL1JlbmRlcmVyIGhlaWdodFxuICAgICAgICBoZWlnaHQ6IDYwMCxcblxuICAgICAgICAvL1RoZSByZXNvbHV0aW9uIG9mIHRoZSByZW5kZXJlciwgdXNlZCB0byBzY2FsZSBpbiByZXRpbmEgZGV2aWNlc1xuICAgICAgICByZXNvbHV0aW9uOiAxLFxuXG4gICAgICAgIC8vVGhlIGNhbnZhcyB0byB1c2UgYXMgYSB2aWV3LCAoYnkgZGVmYXVsdCBwZXJlbnF1ZW4gY3JlYXRlcyBvbmUpXG4gICAgICAgIGNhbnZhczogbnVsbCxcblxuICAgICAgICAvL0NvbG9yIHVzZWQgbGlrZSBhIHJlbmRlcmVyJ3MgYmFja2dyb3VuZCwgKDB4MDAwMDAwIGJ5IGRlZmF1bHQpXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogMHgwMDAwMDAsXG5cbiAgICAgICAgLy9JZiB0aGUgcmVuZGVyIHZpZXcgaXMgdHJhbnNwYXJlbnQsIGRlZmF1bHQgZmFsc2VcbiAgICAgICAgdHJhbnNwYXJlbnRCYWNrZ3JvdW5kOiBmYWxzZSxcblxuICAgICAgICAvL1NldHMgYW50aWFsaWFzIChvbmx5IGFwcGxpY2FibGUgaW4gY2hyb21lIGF0IHRoZSBtb21lbnQpXG4gICAgICAgIHVzZUFudGlhbGlhczogZmFsc2UsXG5cbiAgICAgICAgLy9Vc2UgdGhlIFdlYkdMIHJlbmRlcmVyIGFsd2F5cyBpdCdzIGF2YWlsYWJsZVxuICAgICAgICB1c2VXZWJHTDogdHJ1ZSxcblxuICAgICAgICAvL2VuYWJsZXMgZHJhd2luZyBidWZmZXIgcHJlc2VydmF0aW9uLCBlbmFibGUgdGhpcyBpZiB5b3UgbmVlZCB0byBjYWxsIHRvRGF0YVVybCBvbiB0aGUgd2ViZ2wgY29udGV4dFxuICAgICAgICBwcmVzZXJ2ZURyYXdpbmdCdWZmZXI6IGZhbHNlLFxuXG4gICAgICAgIC8vVXNlIGxvY2FsU3RvcmFnZSB0byBzYXZlIGFsbCB5b3UgbmVlZCB3aXRoIGRhdGFNYW5hZ2VyLCBpZiBpdCdzIGZhbHNlLCB0aGUgZGF0YSBqdXN0IGRlbGV0ZSBhdCByZWZyZXNoXG4gICAgICAgIHVzZVBlcnNpdGFudERhdGE6IGZhbHNlLFxuXG4gICAgICAgIC8vU2NyZWVuIHNjYWxlIGJlaGF2aW9yIHdoZW4gdGhlIGNhbnZhcyBzaXplIGlzIGRpZmZlcmVudCB0byB0aGUgd2luZG93IHNpemUsIGRlZmF1bHQgR0FNRV9TQ0FMRV9UWVBFLk5PTkVcbiAgICAgICAgZ2FtZVNjYWxlVHlwZTogUFEuR0FNRV9TQ0FMRV9UWVBFLk5PTkUsXG5cbiAgICAgICAgLy9JZiB0aGUgcGVyZm9ybWFuY2UgaXMgcG9vciwgdGhlIHRpbWUgYmV0d2VlbiBmcmFtZXMgbmV2ZXIgd2lsbCBnbyBtb3JlIHNsb3dseSB0aGFuIHRoaXNcbiAgICAgICAgbWluRnJhbWVMaW1pdDogMzAsXG5cbiAgICAgICAgLy9QYXVzZSB0aGUgZ2FtZSB3aGVuIGl0IGxvc3QgdGhlIGZvY3VzLCAoZXhhbXBsZTogd2hlbiB5b3UgY2hhbmdlIHRoZSBicm93c2VyJ3MgdGFiKSBkZWZhdWx0IHRydWVcbiAgICAgICAgc3RvcEF0VmlzaWJpbHR5Q2hhbmdlOiB0cnVlLFxuXG4gICAgICAgIC8vVGhpcyBzZXRzIGlmIHRoZSBDYW52YXNSZW5kZXJlciB3aWxsIGNsZWFyIHRoZSBjYW52YXMgb3Igbm90IGJlZm9yZSB0aGUgbmV3IHJlbmRlciBwYXNzLlxuICAgICAgICBjbGVhckJlZm9yZVJlbmRlcjogdHJ1ZVxuXG4gICAgfSxcblxuICAgIC8vQXVkaW8gb3B0aW9uc1xuICAgIGF1ZGlvIDoge1xuXG4gICAgICAgIC8vVXNlIHRoZSBXZWJBdWRpbyBBUEkgYWx3YXlzIGl0J3MgYXZhaWxhYmxlXG4gICAgICAgIHVzZVdlYkF1ZGlvOiB0cnVlLFxuXG4gICAgICAgIC8vRm9yY2UgdGhlIGxvYWRlciB0byBsb2FkIGF1ZGlvIGZpbGVzIGluIHRoaXMgb3JkZXJcbiAgICAgICAgYWxsb3dlZEV4dGVuc2lvbnM6IFtcIm1wM1wiLCBcIm9nZ1wiLCBcIndhdlwiXVxuICAgIH0sXG5cbiAgICAvL0lucHV0IGludGVyYWN0aW9uIG9wdGlvbnNcbiAgICBpbnB1dCA6IHtcbiAgICAgICAgZW5hYmxlTW91c2U6IGZhbHNlLFxuICAgICAgICBlbmFibGVLZXlib2FyZDogZmFsc2UsXG4gICAgICAgIC8vZW5hYmxlR2FtZXBhZDogZmFsc2UsXG4gICAgICAgIGVuYWJsZUFjY2VsZXJvbWV0ZXI6IGZhbHNlLFxuXG4gICAgICAgIG1vdXNlQ2hlY2tGcmVjdWVuY3k6IDMwLFxuICAgICAgICBkaXNhYmxlQ29udGV4dE1lbnU6IHRydWUsXG4gICAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgfSxcblxuICAgIHBsdWdpbnMgOiBbXG4gICAgICAgIC8vSGVyZSB5b3VyIHBsdWdpbnMgbmFtZVxuICAgICAgICAvL1wibG9jYWxlXCIsXG4gICAgICAgIC8vXCJnYW1lcGFkXCJcbiAgICBdXG5cbn07IiwibW9kdWxlLmV4cG9ydHMgPSBQUS5DbGFzcy5leHRlbmQoe1xuICAgIF9pbml0OiBmdW5jdGlvbihnYW1lLCBvcHRpb25zKXtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnN8fHt9O1xuXG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgICAgIHRoaXMubWluVGltZSA9IG9wdGlvbnMubWluVGltZSB8fCAxMDAwMDtcbiAgICAgICAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgMzAwO1xuICAgICAgICB0aGlzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0IHx8IDQwO1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmJhciA9IG5ldyBQUS5HcmFwaGljcygpO1xuICAgICAgICB0aGlzLmxvYWRlciA9IG5ldyBQUS5Bc3NldExvYWRlcigpO1xuXG4gICAgICAgIHRoaXMucmVhZHkgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgYWRkOiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmxvYWRlci5hZGQuYXBwbHkodGhpcy5sb2FkZXIsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBsb2FkOiBmdW5jdGlvbihjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5fc2hvd0xvZ28oKTtcbiAgICAgICAgdGhpcy5sb2FkZXIubG9hZCgpO1xuICAgIH0sXG5cbiAgICBfc2hvd0xvZ286IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBsb2dvID0gbmV3IFBRLlNwcml0ZSgncGVyZW5xdWVuanMtbG9nbycpXG4gICAgICAgICAgICAuc2V0QW5jaG9yKDAuNSwgMSlcbiAgICAgICAgICAgIC5zZXRQb3NpdGlvbih0aGlzLmdhbWUuc2NlbmUud2lkdGgvMiwgdGhpcy5nYW1lLnNjZW5lLmhlaWdodC8yKVxuICAgICAgICAgICAgLmFkZFRvKHRoaXMuZ2FtZS5zY2VuZSk7XG5cblxuICAgICAgICAvL1NpbXBsZSBhbmltYXRpb25cbiAgICAgICAgdmFyIGxvZ29Ud2VlbiA9IGxvZ28udHdlZW4oKS50byh7XG4gICAgICAgICAgICB5IDogbG9nby55KzVcbiAgICAgICAgfSkuc2V0RWFzaW5nKFBRLkVhc2luZy5vdXRTaW5lKCkpXG4gICAgICAgICAgICAuc2V0TG9vcCgpXG4gICAgICAgICAgICAuc2V0UGluZ1BvbmcoKVxuICAgICAgICAgICAgLnNldFRpbWUoMTUwMClcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIHRoaXMuYmFyLmxpbmVTdHlsZSgzLCAweGZmZmZmZiwgMSlcbiAgICAgICAgICAgIC5kcmF3Um91bmRlZFJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIDEwKVxuICAgICAgICAgICAgLnNldFBvc2l0aW9uKHRoaXMuZ2FtZS5zY2VuZS53aWR0aC8yIC0gdGhpcy53aWR0aC8yLCB0aGlzLmdhbWUuc2NlbmUuaGVpZ2h0LzIgKyA1MClcbiAgICAgICAgICAgIC5hZGRUbyh0aGlzLmdhbWUuc2NlbmUpO1xuXG4gICAgICAgIHRoaXMuYmFyLl90b3RhbFByb2dyZXNzID0gMjE7IC8vTWluIHJvdW5kUmVjdCA9IHJhZGl1cyoyICsxXG5cbiAgICAgICAgLy9BZGQgcHJvZ3Jlc3MgYW5pbWF0aW9uIChsaW5lYXIpXG4gICAgICAgIHZhciBiYXJUd2VlbiA9IHRoaXMuYmFyLnR3ZWVuKCkudG8oe1xuICAgICAgICAgICAgX3RvdGFsUHJvZ3Jlc3M6IDg1XG4gICAgICAgIH0pLnNldFRpbWUodGhpcy5taW5UaW1lKVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG5cbiAgICAgICAgLy9UT0RPOiBMb2FkIGVmZmVjdCB3aGVuIGRvbid0IGhhdmUgbm90aGluZyB0byBsb2FkXG4gICAgICAgIHZhciBub3RoaW5nVG9Mb2FkID0gISghIU9iamVjdC5rZXlzKHRoaXMubG9hZGVyLnJlc291cmNlcykubGVuZ3RoKTtcblxuICAgICAgICAvL0Zha2UgbG9hZCBiYXIgZWZmZWN0XG4gICAgICAgIHZhciBzY29wZSA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmFyLnVwZGF0ZSA9IGZ1bmN0aW9uKGdhbWVUaW1lLCBkZWx0YSl7XG4gICAgICAgICAgICBpZihzY29wZS5yZWFkeSlyZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBsb2FkUHJvZ3Jlc3MgPSBzY29wZS5sb2FkZXIucHJvZ3Jlc3MsXG4gICAgICAgICAgICAgICAgdHdlZW5FbmRlZCA9IGJhclR3ZWVuLmlzRW5kZWQsXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MgPSAoc2NvcGUud2lkdGggKiB0aGlzLl90b3RhbFByb2dyZXNzIC8gMTAwKTtcblxuICAgICAgICAgICAgaWYocHJvZ3Jlc3MgPCAyMSl7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3MgPSAyMTtcbiAgICAgICAgICAgIH1lbHNlIGlmKHR3ZWVuRW5kZWQpe1xuICAgICAgICAgICAgICAgIGlmKGxvYWRQcm9ncmVzcyA9PT0gMTAwICYmIHRoaXMuX3RvdGFsUHJvZ3Jlc3MgIT09IGxvYWRQcm9ncmVzcyl7XG4gICAgICAgICAgICAgICAgICAgIGJhclR3ZWVuLnJlc2V0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mcm9tKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdG90YWxQcm9ncmVzcyA6IHRoaXMuX3RvdGFsUHJvZ3Jlc3NcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAudG8oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90b3RhbFByb2dyZXNzIDogMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5zZXRUaW1lKDUwMClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdGFydCgpO1xuICAgICAgICAgICAgICAgIH1lbHNlIGlmKGxvYWRQcm9ncmVzcyA9PT0gMTAwICYmIHRoaXMuX3RvdGFsUHJvZ3Jlc3MgPT09IDEwMCl7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnJlYWR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuX2NvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNsZWFyKClcbiAgICAgICAgICAgICAgICAuYmVnaW5GaWxsKDB4ZmZmZmZmLCAwLjcpXG4gICAgICAgICAgICAgICAgLmRyYXdSb3VuZGVkUmVjdCgwLCAwLCBwcm9ncmVzcywgc2NvcGUuaGVpZ2h0LCAxMClcbiAgICAgICAgICAgICAgICAuZW5kRmlsbCgpXG4gICAgICAgICAgICAgICAgLmxpbmVTdHlsZSgzLCAweGZmZmZmZiwgMSlcbiAgICAgICAgICAgICAgICAuZHJhd1JvdW5kZWRSZWN0KDAsIDAsIHNjb3BlLndpZHRoLCBzY29wZS5oZWlnaHQsIDEwKTtcbiAgICAgICAgfTtcblxuICAgIH0sXG5cbiAgICBfY29tcGxldGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vVE9ETzogUmVtb3ZlIHR3ZWVuc1xuICAgICAgICBpZih0aGlzLmNhbGxiYWNrKXRoaXMuY2FsbGJhY2soKTtcbiAgICB9XG59KTsiLCJ2YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyksXG4gICAgTG9hZEJhciA9IHJlcXVpcmUoJy4vTG9hZEJhcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBRLkNsYXNzLmV4dGVuZCh7XG4gICAgX2luaXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZ2FtZSA9IG5ldyBQUS5HYW1lKGNvbmZpZyk7XG4gICAgICAgIHRoaXMuZ2FtZS5zdGFydCgpO1xuICAgICAgICB0aGlzLl9sb2FkTG9nbygpO1xuICAgIH0sXG5cbiAgICBfbG9hZExvZ286IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZ2FtZS5hc3NldExvYWRlci5hZGQoW1xuICAgICAgICAgICAge3VybDogXCIuL2Fzc2V0cy9pbWFnZXMvcGVyZW5xdWVuanMtbG9nby5wbmdcIiwgbmFtZTogXCJwZXJlbnF1ZW5qcy1sb2dvXCJ9XG4gICAgICAgIF0pLmxvYWQodGhpcy5fbG9hZEFzc2V0cy5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgX2xvYWRBc3NldHM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBsb2FkQmFyID0gbmV3IExvYWRCYXIodGhpcy5nYW1lLCB7XG4gICAgICAgICAgICBtaW5UaW1lIDogNTAwMCxcbiAgICAgICAgICAgIHdpZHRoIDogMzAwLFxuICAgICAgICAgICAgaGVpZ2h0IDogNTBcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBsb2FkQmFyLmFkZChbXG4gICAgICAgICAgICAvL2FkZCB5b3VyIGFzc2V0cyBoZXJlXG5cbiAgICAgICAgICAgIC8ve3VybCA6IFwicGFja2FnZS5qc29uXCJ9XG4gICAgICAgIF0pO1xuXG4gICAgICAgIGxvYWRCYXIubG9hZCh0aGlzLm9uQXNzZXRzTG9hZGVkLmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBvbkFzc2V0c0xvYWRlZDogZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2coJ0FsbCBhc3NldHMgbG9hZGVkIScpO1xuICAgIH1cbn0pOyJdfQ==
