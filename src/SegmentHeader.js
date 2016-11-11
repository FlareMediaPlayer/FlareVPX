'use strict';

var MB_FEATURE_TREE_PROBS = 3;
var MAX_MB_SEGMENTS = 4;

class SegmentHeader {

    constructor(decoder) {
        this.decoder = decoder;
        this.enabled = 0;
        this.update_data = 0;
        this.update_map = 0;
        this.abs = 0; 
        this.tree_probs = new Uint32Array(3);
        this.lf_level = new Int32Array(4);
        this.lf_level_64 = new Float64Array(this.lf_level.buffer);
        this.quant_idx = new Int32Array(4);
        this.quant_idx_64 = new Float64Array(this.quant_idx.buffer);
        
    }

    /**
     * Reinitialize properties if starting with a keyframe
     */
    reInit() {
        this.enabled = 0;
        this.update_data = 0;
        this.update_map = 0;
        this.abs = 0;
        this.tree_probs[0] = 0;
        this.tree_probs[1] = 0;
        this.tree_probs[2] = 0;
        this.lf_level_64[0] = 0;
        this.lf_level_64[1] = 0;
        this.quant_idx_64[0] = 0;
        this.quant_idx_64[1] = 0;
    }

    decode(bool) {
        if (this.decoder.frame_hdr.is_keyframe === true)
            this.reInit();

        this.enabled = bool.get_bit();

        if (this.enabled === 1) {
            var i = 0;

            this.update_map = bool.get_bit();
            this.update_data = bool.get_bit();

            if (this.update_data === 1) {
                this.abs = bool.get_bit();

                for (i = 0; i < MAX_MB_SEGMENTS; i++)
                    this.quant_idx[i] = bool.maybe_get_int(7);

                for (i = 0; i < MAX_MB_SEGMENTS; i++)
                    this.lf_level[i] = bool.maybe_get_int(6);
            }

            if (this.update_map === 1) {
                for (i = 0; i < MB_FEATURE_TREE_PROBS; i++) {
                    if (bool.get_bit() === 1) {
                        this.tree_probs[i] = bool.get_uint(8);
                    } else {
                        this.tree_probs[i] = 255;
                    }
                }
            }
        } else {
            this.update_map = 0;
            this.update_data = 0;
        }
    }
}

module.exports = SegmentHeader;

