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
        this.loader = game.assetLoader;//new PQ.AssetLoader();

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
        var logo = new PQ.Sprite('perenquen-logo')
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
        this.loader.reset();
        if(this.callback)this.callback();

        //Remove the logo's tween (this tween don't stop never, so don't expire never...)
        this.logoTween.remove();
    }
});