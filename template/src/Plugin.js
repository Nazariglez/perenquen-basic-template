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