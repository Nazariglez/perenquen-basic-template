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