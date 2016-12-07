'use strict';

/**
 * @classdesc FrameHeader
 * object version of vp8_frame_hdr
 * @property {number} is_keyframe is it a keyframe
 * @property {number} is_shown should the frame be shown
 * @property {number} part0_sz the partition size of 0
 * @property {number} frame_size_updated indicates if need a resolution update
 */
class FrameHeader {

    constructor() {
        this.is_keyframe = 0;
        this.is_experimental = 0;
        this.version = 0;
        this.is_shown = 0;
        this.part0_sz = 0;
        this.kf = {
            w: 0,
            h: 0,
            scale_w: 0,
            scale_h: 0
        };
        this.frame_size_updated = 0;
    }

    /*
     * vp8_parse_frame_header
     * @param {type} data
     * @param {type} sz
     * @returns {Number}
     */
    parse(data, sz) {


        var clear0 = data[0];
        this.is_keyframe = !(clear0 & 0x01); 
        this.version = (clear0 >> 1) & 7;
        this.is_shown = (clear0 >> 4) & 1;
        this.part0_sz =(clear0 | (data[1] << 8) | (data[2] << 16)) >> 5;
        
        if (sz <= this.part0_sz + (this.is_keyframe ? 10 : 3))
            return VPX_CODEC_CORRUPT_FRAME;

        this.frame_size_updated = 0;

        if (this.is_keyframe === true) {
            var w = this.kf.w;
            var h = this.kf.h;
            var scale_h = this.kf.scale_h;
            var scale_w = this.kf.scale_w;

            if (data[3] !== 0x9d || data[4] !== 0x01 || data[5] !== 0x2a)
                return VPX_CODEC_UNSUP_BITSTREAM;
            
            var data7 = data[7];
            
            this.kf.w = ((data[6] | (data7 << 8)) & 0x3fff);
            this.kf.scale_w =  data7 >> 6;
            this.kf.h = ((data[8] | (data[9] << 8)) & 0x3fff);
            this.kf.scale_h =  data[9] >> 6 ;
            
            
            if(w !== this.kf.w || h !== this.kf.h ){
              this.frame_size_updated = 1;  
            }
    

            if (this.kf.w === 0 || this.kf.h === 0)
                return VPX_CODEC_UNSUP_BITSTREAM;
        }

        return 0;
    }
}


module.exports = FrameHeader;