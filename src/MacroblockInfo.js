"use strict";
var MotionVector = require('./common/mv.js');

class mb_info {
    constructor() {
        //mv_base_info
        this.base = {
            y_mode: 0, //4;
            uv_mode: 0, //4;
            segment_id: 0, //2;
            ref_frame: 0, //2;
            skip_coeff: 0, //1;
            need_mc_border: 0, //1;
            partitioning: null, //2;'enum splitmv_partitioning'
            mv: new MotionVector(),
            eob_mask: 0
        };

        var mvs = new Array(16);
        var i = 16;
        while (i--)
            mvs[i] = new MotionVector();
        

        this.splitt =
                {
                    mvs: mvs,
                    modes: new Uint8Array(16)//16,'todo:enum prediction_mode')
                };
    }
}

module.exports = mb_info;

