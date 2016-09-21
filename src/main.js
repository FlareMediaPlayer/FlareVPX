'use_strict';
//Utility Functions

var VPX_CODEC_CORRUPT_FRAME = -1;
var VPX_CODEC_OK = 1;
var VPX_CODEC_UNSUP_BITSTREAM = 0;
/*
 *
 */
function BITS_MASK(n) {
    return ((1 << (n)) - 1);
}


function BITS_GET(val, bit, len) {
    return (((val) >> (bit)) & BITS_MASK(len));
}

function CHECK_FOR_UPDATE(lval, rval, update_flag) {
    do {
        var old = lval;
        update_flag[0] |= (old !== (lval = rval));
    } while (0)
    return lval;
}

//This is our ctx, just keep one main class
class Vp8 {

    constructor() {
        this.currentFrame;
        this.frameHeader = new FrameHeader(this);
    }

    decode(frame) {
        this.currentFrame = new Uint8Array(frame);
        console.log("decoding");
        var status = 1;

        status = this.vp8_parse_frame_header();

        console.log(this);
    }

    vp8_parse_frame_header() {

        var raw = 0;
        var data = this.currentFrame;

        if (data.byteLength < 10)
            return VPX_CODEC_CORRUPT_FRAME;

        raw = data[0] | (data[1] << 8) | (data[2] << 16);
        this.frameHeader.is_keyframe = !BITS_GET(raw, 0, 1);
        this.frameHeader.version = BITS_GET(raw, 1, 2);
        this.frameHeader.is_experimental = BITS_GET(raw, 3, 1);
        this.frameHeader.is_shown = BITS_GET(raw, 4, 1);
        this.frameHeader.part0_sz = BITS_GET(raw, 5, 19);

        if (data.byteLength <= this.frameHeader.part0_sz + (this.frameHeader.is_keyframe ? 10 : 3))
            return VPX_CODEC_CORRUPT_FRAME;

        this.frameHeader.frame_size_updated = 0;

        if (this.frameHeader.is_keyframe)
        {
            var update = [0];

            /* Keyframe header consists of a three byte sync code followed
             * by the width and height and associated scaling factors.
             */
            if (data[3] != 0x9d || data[4] != 0x01 || data[5] != 0x2a)
                return VPX_CODEC_UNSUP_BITSTREAM;

            raw = data[6] | (data[7] << 8)
                    | (data[8] << 16) | (data[9] << 24);

            this.frameHeader.kf.w = CHECK_FOR_UPDATE(this.frameHeader.kf.w, BITS_GET(raw, 0, 14),
                    update);
            this.frameHeader.kf.scale_w = CHECK_FOR_UPDATE(this.frameHeader.kf.scale_w, BITS_GET(raw, 14, 2),
                    update);
            this.frameHeader.kf.h = CHECK_FOR_UPDATE(this.frameHeader.kf.h, BITS_GET(raw, 16, 14),
                    update);
            this.frameHeader.kf.scale_h = CHECK_FOR_UPDATE(this.frameHeader.kf.scale_h, BITS_GET(raw, 30, 2),
                    update);

            this.frameHeader.frame_size_updated = update[0];

            if (!this.frameHeader.kf.w || !this.frameHeader.kf.h)
                return VPX_CODEC_UNSUP_BITSTREAM;
        }


        return VPX_CODEC_OK;
    }

}

class FrameHeader {

    constructor(context) {
        this.context = context;
        this.kf = {//vp8_kf_hdr:
            w: 0, /* Width */
            h: 0, /* Height */
            scale_w: 0, /* Scaling factor, Width */
            scale_h: 0   /* Scaling factor, Height */
        }; // kf;
    }
}

window.Flare = window.Flare || {};
window.Flare.Vp8 = Vp8;
module.exports = Vp8;