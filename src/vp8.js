"use strict";

var FrameHeader = require('./FrameHeader');
var BoolDecoder = require('./BoolDecoder.js');
var SegmentHeader = require('./SegmentHeader.js');
var LoopFilterHeader = require('./LoopFilterHeader.js');
var TokenHeader = require('./TokenHeader.js');
var QuantizationHeader = require('./QuantizationHeader.js');
var ReferenceHeader = require('./ReferenceHeader.js');
var EntropyHeader = require('./EntropyHeader.js');
var vpx_image_t = require('./Image.js');
var mb_info = require('./MacroblockInfo.js');
var Predict = require('./Predict.js');
var TABLES = require('./Tables.js');

var TOKEN_BLOCK_Y1 = 0;
var TOKEN_BLOCK_UV = 1;
var TOKEN_BLOCK_Y2 = 2;
var TOKEN_BLOCK_TYPES = 3;


var FRAME_HEADER_SZ = 3;
var KEYFRAME_HEADER_SZ = 7;
var MAX_PARTITIONS = 8;


var CURRENT_FRAME = 0;
var LAST_FRAME = 1;
var GOLDEN_FRAME = 2;
var ALTREF_FRAME = 3;
var NUM_REF_FRAMES = 4;

var MAX_PARTITIONS = 8;
var MAX_MB_SEGMENTS = 4;

var getTimestamp;
if (typeof performance === 'undefined' || typeof performance.now === 'undefined') {
    getTimestamp = Date.now;
} else {
    getTimestamp = performance.now.bind(performance);
}

Uint8Array.prototype.ptr = 0;

var ref_cnt_img = function () {
    this.img = new vpx_image_t();
    this.ref_cnt = 0;
};


class dequant_factors {
    constructor() {
        this.quant_idx = 0;
        this.factor = [
            new Int16Array([0, 0]), //Y1
            new Int16Array([0, 0]), // UV
            new Int16Array([0, 0]) //Y2
        ];
        
    }
}

//Helper functions for dequant_init
var min = Math.min;
var max = Math.max;

function clamp_q(q) {
   return min(max(q, 0), 127)|0;
}

var quant_common = require('./common/quant_common.js');
var vp8_dc_quant = quant_common.vp8_dc_quant;
var vp8_dc2quant = quant_common.vp8_dc2quant;
var vp8_dc_uv_quant = quant_common.vp8_dc_uv_quant;
var vp8_ac_yquant = quant_common.vp8_ac_yquant;
var vp8_ac2quant = quant_common.vp8_ac2quant;
var vp8_ac_uv_quant = quant_common.vp8_ac_uv_quant;


/*
 * likely vp8cx_init_de_quantizer
 * @param {type} factors
 * @param {type} seg
 * @param {type} quant_hdr
 * @returns {undefined}
 */
function dequant_init(factors, seg, quant_hdr) {
    var i = 0;
    var q = 0;
    var dqf = factors;
    var factor;
    
    var length = 1;
    if(seg.enabled === 1){
        length = MAX_MB_SEGMENTS;
    }

    for (i = 0; i < length; i++) {
        q = quant_hdr.q_index;

        if (seg.enabled === 1)
            q = (!seg.abs) ? q + seg.quant_idx[i] : seg.quant_idx[i];

        factor = dqf[i].factor;

        if (dqf[i].quant_idx !== q || quant_hdr.delta_update) {
            factor[TOKEN_BLOCK_Y1][0] = vp8_dc_quant(q , quant_hdr.y1_dc_delta_q);
            factor[TOKEN_BLOCK_Y2][0] = vp8_dc2quant(q , quant_hdr.y2_dc_delta_q); 
            factor[TOKEN_BLOCK_UV][0] = vp8_dc_uv_quant(q , quant_hdr.uv_dc_delta_q);
            factor[TOKEN_BLOCK_Y1][1] = vp8_ac_yquant(q);
            factor[TOKEN_BLOCK_Y2][1] = vp8_ac2quant(q , quant_hdr.y2_ac_delta_q);
            factor[TOKEN_BLOCK_UV][1] = vp8_ac_uv_quant(q , quant_hdr.uv_ac_delta_q);
            

            dqf[i].quant_idx = q;
        }
    }
}

/*
module.exports.vp8_ac_uv_quant = vp8_ac_uv_quant;
 */

class token_decoder {
    
    constructor() {
        this.bool = new BoolDecoder();
        this.left_token_entropy_ctx = new Int32Array(9);
        this.coeffs = 0;
    }
    
}

class Vp8 {

    constructor(options) {
        this.loadedMetadata = true;
        this.frameBuffer = null;
        this.videoOptions = options || null;
        if (options) {
            this.videoFormat = options.videoFormat;
        }


        this.cpuTime = 0;

        this.saved_entropy_valid = 0;


        this.frame_hdr = new FrameHeader();
        this.boolDecoder = new BoolDecoder();
        this.segment_hdr = new SegmentHeader(this);
        this.loopfilter_hdr = new LoopFilterHeader(this);   
        this.token_hdr = new TokenHeader(this);
        this.quant_hdr = new QuantizationHeader();
        this.reference_hdr = new ReferenceHeader(this);
        this.entropy_hdr = new EntropyHeader(this);
        this.saved_entropy = new EntropyHeader(this);
        
        
        this.tokens = new Array(MAX_PARTITIONS);
        for (var i = 0; i < MAX_PARTITIONS; i ++)
            this.tokens[i] = new token_decoder();
        
        
        
        this.frame_strg = [
            {
                img: new vpx_image_t(),
                ref_cnt: 0
            },
            {
                img: new vpx_image_t(),
                ref_cnt: 0
            },
            {
                img: new vpx_image_t(),
                ref_cnt: 0
            },
            {
                img: new vpx_image_t(),
                ref_cnt: 0
            }
        ];
        
        
        this.ref_frames = new Array(NUM_REF_FRAMES);
        for (var i = 0; i < NUM_REF_FRAMES; i ++)
            this.ref_frames[i] = new ref_cnt_img();
        
        this.dequant_factors = new Array(MAX_MB_SEGMENTS);
        for (var i = 0; i < MAX_MB_SEGMENTS; i ++)
            this.dequant_factors[i] = new dequant_factors();

        this.ref_frame_offsets = new Uint32Array([0, 0, 0, 0]); 
        this.ref_frame_offsets_ = [0, 0, 0, 0]; 
        this.subpixel_filters = null;
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
    
    /**
     * vp8_dixie_modemv_init
     * @returns {undefined}
     */
    modemv_init() {
        var mbi_w = 0;
        var mbi_h = 0;
        var i = 0;
        var mbi = new mb_info();
        var ptr = 0;//*

        mbi_w = this.mb_cols + 1; /* For left border col */
        mbi_h = this.mb_rows + 1; /* For above border row */

        if (this.frame_hdr.frame_size_updated === 1) {
            this.mb_info_storage = null;
            this.mb_info_rows_storage = null;
        }

        if (this.mb_info_storage === null) {
            var length = mbi_w * mbi_h;
            this.mb_info_storage = new Array(length);


            for (var i = 0; i < length; i ++)
                this.mb_info_storage[i] = new mb_info();

            this.mb_info_storage_off = 0;
        }

        if (this.mb_info_rows_storage === null) {
            this.mb_info_rows_storage_off = new Uint32Array(mbi_h);
        }

        ptr = this.mb_info_storage_off + 1;

        for (i = 0; i < mbi_h; i++) {
            this.mb_info_rows_storage_off[i] = ptr;
            ptr = (ptr + mbi_w)|0;
        }
        

        this.mb_info_rows = this.mb_info_storage;
        this.mb_info_rows_off = this.mb_info_rows_storage_off;//todo: + 1;
    }
    
    /**
     * Use this just for testing, figure out where to put this later
     * @returns {undefined}
     */
    dequantInit(){
        dequant_init(this.dequant_factors, this.segment_hdr, this.quant_hdr);
    }
}


module.exports = Vp8;