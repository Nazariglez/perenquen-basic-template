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

        this.bar.beginFill(0xb2b2b2, 1)
            .drawRect(0, 0, this.width, this.height)
            .endFill()
            .lineStyle(3, 0xffffff, 1)
            .drawRect(0, 0, this.width, this.height)
            .setPosition(this.game.scene.width/2 - this.width/2, this.game.scene.height/2 + 50)
            .addTo(this.game.scene);

        this.bar._totalProgress = 1;

        var maxProgress = 85;

        var nothingToLoad = !(!!Object.keys(this.loader.resources).length);
        if(nothingToLoad){
            maxProgress = 100;
        }

        //Add progress animation (linear)
        this.barTween = this.bar.tween().to({
            _totalProgress: maxProgress
        }).setTime(this.minTime)
            //.setEasing(PQ.Easing.outSine())
            .start();

        //Fake load bar effect
        var scope = this;
        this.bar.update = function(gameTime, delta){
            if(scope.ready)return;

            var loadProgress = scope.loader.progress,
                tweenEnded = scope.barTween.isEnded,
                progress = (scope.width * this._totalProgress / 100);

            if(tweenEnded){
                if(nothingToLoad){

                    scope.ready = true;
                    scope._complete();

                }else {

                    if (loadProgress === 100 && this._totalProgress !== loadProgress) {
                        scope.barTween.reset()
                            .from({
                                _totalProgress: this._totalProgress
                            })
                            .to({
                                _totalProgress: 100
                            }).setTime(500)
                            .setEasing(PQ.Easing.linear())
                            .start();
                    } else if (loadProgress === 100 && this._totalProgress === 100) {
                        scope.ready = true;
                        scope._complete();
                    }

                }
            }

            this.beginFill(0xffffff, 1)
                .drawRect(0, 0, progress, scope.height)
                .endFill();
        };

    },

    _assetLoaded: function(loader, resource){
          console.log(resource);
    },

    _complete: function(){
        if(this.callback)this.callback();
        this.destroy();
    },

    destroy: function(){
        this.logoTween.remove();
        this.barTween.remove();
    }
});