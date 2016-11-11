"use strict";

var FrameHeader = require('./FrameHeader');
var BoolDecoder = require('./BoolDecoder.js');
var SegmentHeader = require('./SegmentHeader.js');

var FRAME_HEADER_SZ = 3;
var KEYFRAME_HEADER_SZ = 7;

var getTimestamp;
if (typeof performance === 'undefined' || typeof performance.now === 'undefined') {
    getTimestamp = Date.now;
} else {
    getTimestamp = performance.now.bind(performance);
}

Uint8Array.prototype.ptr = 0;

class Vp8 {

    constructor(options) {
        this.loadedMetadata = true;
        this.frameBuffer = null;
        this.videoOptions = options || null;
        if (options) {
            this.videoFormat = options.videoFormat;
        }


        this.cpuTime = 0;

        this.frame_hdr = new FrameHeader();
        this.boolDecoder = new BoolDecoder();
        this.segment_hdr = new SegmentHeader(this);
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

    decode() {

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

        if (this.frame_hdr.is_keyframe === true) {
            data.ptr += KEYFRAME_HEADER_SZ;
            sz -= KEYFRAME_HEADER_SZ;
            this.mb_cols = ((this.frame_hdr.kf.w + 15) / 16) | 0;
            this.mb_rows = ((this.frame_hdr.kf.h + 15) / 16) | 0;
        }

        //Initialisze the boolDecoder
        this.boolDecoder.init(data, data.ptr, this.frame_hdr.part0_sz);

        /* Skip the colorspace and clamping bits */
        //line 708
        if (this.frame_hdr.is_keyframe === true)
            this.boolDecoder.get_uint(2);//skipping both bits for now
        //if (this.boolDecoder.get_uint(2))
        //throw "colorspace error";

        this.segment_hdr.decode(this.boolDecoder);
    }
}


module.exports = Vp8;