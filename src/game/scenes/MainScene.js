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