'use strict';

var BLOCK_CONTEXTS = 4;

class LoopFilterHeader {

    constructor(decoder) {
        this.decoder = decoder;
        this.use_simple = 0;
        this.level = 0;
        this.sharpness = 0;
        this.delta_enabled = 0;
        this.ref_delta = new Int32Array(4);
        this.mode_delta = new Int32Array(4);
    }

    reInit() {
        this.use_simple = 0;
        this.level = 0;
        this.sharpness = 0;
        this.delta_enabled = 0;
        
        this.ref_delta[0] = 0;
        this.ref_delta[1] = 0;
        this.ref_delta[2] = 0;
        this.ref_delta[3] = 0;

        this.mode_delta[0] = 0;
        this.mode_delta[1] = 0;
        this.mode_delta[2] = 0;
        this.mode_delta[3] = 0;
    }

    decode(bool) {
        if (this.decoder.frame_hdr.is_keyframe === true)
            this.reInit();

        this.use_simple = bool.get_bit();
        this.level = bool.get_uint(6);
        this.sharpness = bool.get_uint(3);
        this.delta_enabled = bool.get_bit();
        
        var ref_delta = this.ref_delta;

        if (this.delta_enabled === 1 && bool.get_bit() === 1) {

            ref_delta[0] = bool.maybe_get_int(6);
            ref_delta[1] = bool.maybe_get_int(6);
            ref_delta[2] = bool.maybe_get_int(6);
            ref_delta[3] = bool.maybe_get_int(6);

            this.mode_delta[0] = bool.maybe_get_int(6);
            this.mode_delta[1] = bool.maybe_get_int(6);
            this.mode_delta[2] = bool.maybe_get_int(6);
            this.mode_delta[3] = bool.maybe_get_int(6);
            
        }
    }
}

module.exports = LoopFilterHeader;
