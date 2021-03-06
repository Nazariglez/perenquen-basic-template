module.exports = {
    //Game's id, uses to save data at localstorage
    id: 'pq.defaultbundle.id',

    //Version of this game, also uses in localstorage metadata
    version: "0.0.0",

    //Activate debug mode, to show bounds, etc...
    debug: false,

    //Log out the perenquen's name, version, and web
    sayHello: true,

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

        //If the performance is poor, the time between frames never will go more slowly than this (in frame)
        minFrameLimit: 20, //todo: move up, out of game section, this is more like a system option

        //Pause the game when it lost the focus, (example: when you change the browser's tab) default true
        stopAtVisibiltyChange: true,

        //This sets if the CanvasRenderer will clear the canvas or not before the new render pass.
        clearBeforeRender: true

    },

    //Audio options
    audio : {

        //Use the WebAudio API always it's available
        useWebAudio: true,

        //Allowed audio types
        allowedExtensions: ["mp3", "ogg", "wav", "m4a"]
    },

    //Input interaction options
    input : {
        enableMouse: false,
        enableMouseInteractivity: false,
        checkInteractivityFrecuency: 30,
        mousePreventDefault: true,
        disableContextMenu: true,

        enableKeyboard: false,
        enableGamepad: false,

        enableAccelerometer: false
    },

    plugins : [
        //Here your plugins name
        //"locale"
    ]

};