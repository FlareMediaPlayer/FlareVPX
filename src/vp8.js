"use strict";

var FrameHeader = require('./FrameHeader');


var getTimestamp;
if (typeof performance === 'undefined' || typeof performance.now === 'undefined') {
    getTimestamp = Date.now;
} else {
    getTimestamp = performance.now.bind(performance);
}


class Vp8 {

    constructor(options) {
        this.loadedMetadata = true;
        this.frameBuffer = null;
        this.videoOptions = options || null;
        if(options){
            this.videoFormat = options.videoFormat;
        }
        
        
        this.cpuTime = 0;
        
        this.frame_hdr = new FrameHeader();
    }
    
    init(callback) {
        //Nop leftover from ogv
        console.warn("STARTING CODEC");
        callback();
    }

    processHeader(data, callback) {
        //Nop leftover from ogv
        console.error("PROCESS HEADER");
        this.loadedMetadata = true;
        callback(0);
    }
    
    decode(){
        
    }
    
    processFrame(buf, callback) {
        var start = getTimestamp();
        
        
        this.decode_frame(new Uint8Array(buf));
        
        
        var delta = (getTimestamp() - start);
        this.cpuTime += delta;
        //callback(1);
    }
    
    decode_frame(data) {
        var sz = data.byteLength;
        
        var res;
        var i = 0;
        var row = 0;
        var partition = 0;
        var ii = 0;

        this.saved_entropy_valid = 0;
        
        //Parse our frame header
        if ((res = this.frame_hdr.parse(data, sz)))
            throw "Failed to parse frame header";
    }
}


module.exports = Vp8;