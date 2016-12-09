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
var mb_info = require('./MacroblockInfo.js');
var MotionVector = require('./common/mv.js');

var decodemv = require("./decoder/decodemv.js");
var read_mb_features = decodemv.read_mb_features;
var decode_kf_mb_mode = decodemv.decode_kf_mb_mode;


var TOKEN_BLOCK_Y1 = 0;
var TOKEN_BLOCK_UV = 1;
var TOKEN_BLOCK_Y2 = 2;
var TOKEN_BLOCK_TYPES = 3;


var B_DC_PRED = 0; /* average of above and left pixels */
var B_TM_PRED = 1;
var B_VE_PRED = 2; /* vertical prediction */
var B_HE_PRED = 3; /* horizontal prediction */
var LEFT4X4 = 10;
var ABOVE4X4 = 11;
var ZERO4X4 = 12;
var NEW4X4 = 13;
var B_MODE_COUNT = 14;


var CNT_BEST = 0;
var CNT_ZEROZERO = 0;
var CNT_NEAREST = 1;
var CNT_NEAR = 2;
var CNT_SPLITMV = 3;
        
        
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


var DC_PRED = 0;
var V_PRED = 1;
var H_PRED = 2; 
var TM_PRED = 3; 
var B_PRED = 4; 
var NEARESTMV = 5;
var NEARMV = 6;
var ZEROMV = 7;
var NEWMV = 8;
var SPLITMV = 9;
var MB_MODE_COUNT = 10;

var b_mode_tree = TABLES.b_mode_tree;
var kf_y_mode_tree = TABLES.kf_y_mode_tree;
var kf_y_mode_probs = TABLES.kf_y_mode_probs;

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




function clamp_mv(raw, bounds) {
    var newmv = new MotionVector();
    //newmv.x = (raw.x < bounds.to_left)
      //      ? bounds.to_left : raw.x;
    if (raw.x < bounds.to_left) {
        newmv.x = bounds.to_left;
    } else {
        newmv.x = raw.x;
    }
            
    //newmv.x = (raw.x > bounds.to_right)
      //      ? bounds.to_right : newmv.x;
      
    if (raw.x > bounds.to_right) {
        newmv.x = bounds.to_right;
    } //else {
      //  newmv.x = newmv.x;
    //}        
            
    //newmv.y = (raw.y < bounds.to_top)
      //      ? bounds.to_top : raw.y;
            
    if (raw.y < bounds.to_top) {
        newmv.y = bounds.to_top;
    } else {
        newmv.y = raw.y;
    }        
            
    newmv.y = (raw.y > bounds.to_bottom)
            ? bounds.to_bottom : newmv.y;
            
    if (raw.y > bounds.to_bottom) {
        newmv.y = bounds.to_bottom;
    } 
    
    
    return newmv;
}

function read_mv(bool, mv, mvc) {
    mv.y = read_mv_component(bool, mvc[0]);
    mv.x = read_mv_component(bool, mvc[1]);
}


function decode_split_mv(this_, left_, above_, hdr, best_mv, bool) {
    var partition = 0;
    var j = 0, k = 0, mask = 0, partition_id = 0;


    partition_id = bool.read_tree(TABLES.split_mv_tree, TABLES.split_mv_probs);
    partition = TABLES.mv_partitions[partition_id];
    this_.base.partitioning = partition_id;

    for (j = 0, mask = 0; mask < 65535; j++) {
        var mv_ = new MotionVector();
        var left_mv;
        var above_mv;//='mv'='mv'
        var subblock_mode;//='prediction_mode'

        /* Find the first subblock in this partition. */
        for (k = 0; j !== partition[k]; k++);

        /* Decode the next MV */
        left_mv = left_block_mv(this_, left_, k);
        above_mv = above_block_mv(this_, above_, k);
        subblock_mode = submv_ref(bool, left_mv, above_mv);

        switch (subblock_mode) {
            case LEFT4X4:
                mv_ = left_mv;
                break;
            case ABOVE4X4:
                mv_ = above_mv;
                break;
            case ZERO4X4:
                mv_.x = mv_.y = 0;//.raw
                break;
            case NEW4X4:
                read_mv(bool, mv_, hdr.mv_probs);
                mv_.x = (mv_.x + best_mv.x)|0;
                mv_.y = (mv_.y + best_mv.y)|0;
                break;
            default:
                throw "ERROR :(";
        }

        /* Fill the MV's for this partition */
        for (; k < 16; k++)
            if (j === partition[k]) {
                this_.splitt.mvs[k].x = mv_.x;
                this_.splitt.mvs[k].y = mv_.y;
                mask |= 1 << k;
            }
    
    }
}

function mv_bias(mb, sign_bias, ref_frame, mv) {
    if (sign_bias[mb.base.ref_frame] ^ sign_bias[ref_frame]) {
        mv.x *= -1;
        mv.y *= -1;
    }
}

function submv_ref(bool, l, a) {
    var
            SUBMVREF_NORMAL = 0,
            SUBMVREF_LEFT_ZED = 1,
            SUBMVREF_ABOVE_ZED = 2,
            SUBMVREF_LEFT_ABOVE_SAME = 3,
            SUBMVREF_LEFT_ABOVE_ZED = 4
            ;

    var lez = !(l.x || l.y) + 0;//.raw
    var aez = !(a.x || a.y) + 0;//.raw
    var lea = (l.x === a.x && l.y === a.y) + 0;//l.raw == a.raw
    var ctx = SUBMVREF_NORMAL;

    if (lea && lez)
        ctx = SUBMVREF_LEFT_ABOVE_ZED;
    else if (lea)
        ctx = SUBMVREF_LEFT_ABOVE_SAME;
    else if (aez)
        ctx = SUBMVREF_ABOVE_ZED;
    else if (lez)
        ctx = SUBMVREF_LEFT_ZED;

    return bool.read_tree(TABLES.submv_ref_tree, TABLES.submv_ref_probs2[ctx]);
}

function need_mc_border(mv, l, t, b_w, w, h) {
    var b = 0, r = 0;

    /* Get distance to edge for top-left pixel */
    l += (mv.x >> 3)|0;
    t += (mv.y >> 3)|0;

    /* Get distance to edge for bottom-right pixel */
    r = (w - (l + b_w))|0;
    b = (h - (t + b_w))|0;

    return (l >> 1 < 2 || r >> 1 < 3 || t >> 1 < 2 || b >> 1 < 3)|0;
}


function above_block_mv(this_, above_, b) {
    if (b < 4)
    {
        if (above_.base.y_mode === SPLITMV)
            return above_.splitt.mvs[b + 12];

        return above_.base.mv;
    }

    return this_.splitt.mvs[b - 4];
}

function left_block_mv(this_, left_, b) {
    if (!(b & 3)) {
        if (left_.base.y_mode === SPLITMV)
            return left_.splitt.mvs[b + 3];

        return left_.base.mv;
    }

    return this_.splitt.mvs[b - 1];
}

function read_mv_component(bool, mvc) {
    var IS_SHORT = 0, SIGN = 1, SHORT = 2, BITS = SHORT + 7, LONG_WIDTH = 10;
    var x = 0;

    if (bool.get_prob(mvc[IS_SHORT])) /* Large */
    {
        var i = 0;

        for (i = 0; i < 3; i++)
            x += bool.get_prob(mvc[BITS + i]) << i;

        /* Skip bit 3, which is sometimes implicit */
        for (i = LONG_WIDTH - 1; i > 3; i--)
            x += bool.get_prob(mvc[BITS + i]) << i;

        if (!(x & 0xFFF0) || bool.get_prob(mvc[BITS + 3]))
            x += 8;
    } else   /* small */
        x = bool.read_tree(TABLES.small_mv_tree, mvc, +SHORT);//todo

    if (x && bool.get_prob(mvc[SIGN]))
        x = -x;

    return (x << 1)|0;
}


//Helper functions for dequant_init
var min = Math.min;
var max = Math.max;

function clamp_q(q) {
   return min(max(q, 0), 127)|0;
}

var near_mvs_4 = [
    new MotionVector(),
    new MotionVector(),
    new MotionVector(),
    new MotionVector()
];


var chroma_mv_4 = [
    new MotionVector(),
    new MotionVector(),
    new MotionVector(),
    new MotionVector()
];

var this_mv_1 = new MotionVector();

var this_mv_2 = new MotionVector();

function find_near_mvs(this_, left, left_off,
        above, above_off,
        sign_bias, near_mvs,
        cnt) {
    var aboveleft = above;
    var aboveleft_off = above_off - 1;
    var mv_ = (near_mvs);
    var mv_off = 0;
    var cntx = cnt;
    var cntx_off = 0;

    /* Zero accumulators */
    mv_[0].x = mv_[1].x = mv_[2].x = 0;//.raw
    mv_[0].y = mv_[1].y = mv_[2].y = 0;//.raw
    cnt[0] = cnt[1] = cnt[2] = cnt[3] = 0;

    var above_ = above[above_off];
    var left_ = left[left_off];
    var aboveleft_ = aboveleft[aboveleft_off];
    /* Process above */
    if (above_.base.ref_frame !== CURRENT_FRAME) {
        if (above_.base.mv.x || above_.base.mv.y)//.raw
        {
            mv_[(++mv_off)].x = above_.base.mv.x;//.raw
            mv_[(mv_off)].y = above_.base.mv.y;//.raw
            mv_bias(above_, sign_bias, this_.base.ref_frame, mv_[mv_off]);
            ++cntx_off;
        }

        cntx[cntx_off] += 2;
    }

    /* Process left */
    if (left_.base.ref_frame !== CURRENT_FRAME) {
        if (left_.base.mv.x || left_.base.mv.y){//.raw 
            var this_mv = this_mv_1;

            this_mv.x = left_.base.mv.x;//.raw
            this_mv.y = left_.base.mv.y;//.raw
            mv_bias(left_, sign_bias, this_.base.ref_frame, this_mv);

            if (this_mv.x !== mv_[mv_off].x || this_mv.y !== mv_[mv_off].y)//.raw!=->raw
            {
                mv_[(++mv_off)].x = this_mv.x;//->raw
                mv_[(mv_off)].y = this_mv.y;//->raw
                ++cntx_off;
            }

            cntx[cntx_off] += 2;
        } else
            cnt[CNT_ZEROZERO] += 2;
    }

    /* Process above left */
    if (aboveleft_.base.ref_frame !== CURRENT_FRAME)
    {
        if (aboveleft_.base.mv.x || aboveleft_.base.mv.y)//.raw
        {
            var this_mv = this_mv_2;

            this_mv.x = aboveleft_.base.mv.x;//.raw
            this_mv.y = aboveleft_.base.mv.y;//.raw
            mv_bias(aboveleft_, sign_bias, this_.base.ref_frame,
                    this_mv);

            if (this_mv.x !== mv_[mv_off].x || this_mv.y !== mv_[mv_off].y)//.raw
            {
                mv_[(++mv_off)].x = this_mv.x;//.raw
                mv_[(mv_off)].y = this_mv.y;//.raw
                ++cntx_off;
            }

            cntx[cntx_off] += 1;
        } else
            cnt[CNT_ZEROZERO] += 1;
    }

    /* If we have three distinct MV's ... */
    if (cnt[CNT_SPLITMV]) {
        /* See if above-left MV can be merged with NEAREST */
        if (mv_[mv_off].x === near_mvs[CNT_NEAREST].x && mv_[mv_off].y === near_mvs[CNT_NEAREST].y)//.raw
            cnt[CNT_NEAREST] += 1;
    }

    cnt[CNT_SPLITMV] = ((above_.base.y_mode === SPLITMV)
            + (left_.base.y_mode === SPLITMV)) * 2
            + (aboveleft_.base.y_mode === SPLITMV);

    /* Swap near and nearest if necessary */
    if (cnt[CNT_NEAR] > cnt[CNT_NEAREST]) {
        var tmp = 0;
        var tmp2 = 0;
        tmp = cnt[CNT_NEAREST];
        cnt[CNT_NEAREST] = cnt[CNT_NEAR];
        cnt[CNT_NEAR] = tmp;
        tmp = near_mvs[CNT_NEAREST].x;//.raw;
        tmp2 = near_mvs[CNT_NEAREST].y;//.raw;
        near_mvs[CNT_NEAREST].x = near_mvs[CNT_NEAR].x;
        near_mvs[CNT_NEAREST].y = near_mvs[CNT_NEAR].y;
        near_mvs[CNT_NEAR].x = tmp;
        near_mvs[CNT_NEAR].y = tmp2;
    }

    /* Use near_mvs[CNT_BEST] to store the "best" MV. Note that this
     * storage shares the same address as near_mvs[CNT_ZEROZERO].
     */
    if (cnt[CNT_NEAREST] >= cnt[CNT_BEST]) {
        near_mvs[CNT_BEST].x = near_mvs[CNT_NEAREST].x;
        near_mvs[CNT_BEST].y = near_mvs[CNT_NEAREST].y;
    }
}



var clamped_best_mv_1 = new MotionVector();

var mv_cnts_decode_mvs = new Int32Array(4);
var probs_decode_mvs = new Uint8Array(4);

var quant_common = require('./common/quant_common.js');
var vp8_dc_quant = quant_common.vp8_dc_quant;
var vp8_dc2quant = quant_common.vp8_dc2quant;
var vp8_dc_uv_quant = quant_common.vp8_dc_uv_quant;
var vp8_ac_yquant = quant_common.vp8_ac_yquant;
var vp8_ac2quant = quant_common.vp8_ac2quant;
var vp8_ac_uv_quant = quant_common.vp8_ac_uv_quant;

function decode_mvs(ctx, this_, this_off,
        left, left_off, above, above_off, bounds,
        bool) {
    var hdr = ctx.entropy_hdr;
    var near_mvs = near_mvs_4;
    var clamped_best_mv = clamped_best_mv_1;
    //var mv_cnts = new Int32Array(4);
    //var probs = new Uint8Array(4);
    var mv_cnts = mv_cnts_decode_mvs;
    var probs = probs_decode_mvs;
    var BEST = 0, NEAREST = 1, NEAR = 2;
    var x = 0, y = 0, w = 0, h = 0, b = 0;

    this_[this_off].base.ref_frame = bool.get_prob(hdr.prob_last)
            ? 2 + bool.get_prob(hdr.prob_gf)
            : 1;

    find_near_mvs(this_[this_off], this_, this_off - 1, above, above_off, ctx.reference_hdr.sign_bias,
            near_mvs, mv_cnts);
    probs[0] = TABLES.mv_counts_to_probs[mv_cnts[0]][0];
    probs[1] = TABLES.mv_counts_to_probs[mv_cnts[1]][1];
    probs[2] = TABLES.mv_counts_to_probs[mv_cnts[2]][2];
    probs[3] = TABLES.mv_counts_to_probs[mv_cnts[3]][3];

    this_ = this_[this_off];

    this_.base.y_mode = bool.read_tree(TABLES.mv_ref_tree, probs);
    this_.base.uv_mode = this_.base.y_mode;

    this_.base.need_mc_border = 0;
    x = (-bounds.to_left - 128) >> 3;
    y = (-bounds.to_top - 128) >> 3;
    w = (ctx.mb_cols << 4)|0;
    h = ctx.mb_rows * 16;

    switch (this_.base.y_mode)
    {
        case NEARESTMV:
            this_.base.mv = clamp_mv(near_mvs[NEAREST], bounds);
            break;
        case NEARMV:
            this_.base.mv = clamp_mv(near_mvs[NEAR], bounds);
            break;
        case ZEROMV:
            this_.base.mv.x = this_.base.mv.y = 0;//.raw
            return; //skip need_mc_border check
        case NEWMV:
            clamped_best_mv = clamp_mv(near_mvs[BEST], bounds);
            read_mv(bool, this_.base.mv, hdr.mv_probs);//&this->base.mv
            this_.base.mv.x += clamped_best_mv.x;
            this_.base.mv.y += clamped_best_mv.y;
            break;
        case SPLITMV:
        {
            var chroma_mv = chroma_mv_4;// = {{{0}}};

            clamped_best_mv = clamp_mv(near_mvs[BEST], bounds);
            decode_split_mv(this_, left[left_off], above[above_off], hdr, clamped_best_mv, bool);//&clamped_best_mv
            this_.base.mv.x = this_.splitt.mvs[15].x;
            this_.base.mv.y = this_.splitt.mvs[15].y;

            for (b = 0; b < 16; b++) {
                chroma_mv[(b >> 1 & 1) + (b >> 2 & 2)].x +=
                        this_.splitt.mvs[b].x;
                chroma_mv[(b >> 1 & 1) + (b >> 2 & 2)].y +=
                        this_.splitt.mvs[b].y;

                if (need_mc_border(this_.splitt.mvs[b],
                        x + (b & 3) * 4, y + (b & ~3), 4, w, h))
                {
                    this_.base.need_mc_border = 1;
                    break;
                }
            }

            for (b = 0; b < 4; b++) {
                chroma_mv[b].x += 4/* + 8 * (chroma_mv[b].x >> 31)*/;
                chroma_mv[b].y += 4/* + 8 * (chroma_mv[b].y >> 31)*/;
                chroma_mv[b].x >>= 2;//chroma_mv[b].x=parseInt(chroma_mv[b].x,10);
                chroma_mv[b].y >>= 2;//chroma_mv[b].y=parseInt(chroma_mv[b].y,10);

                //note we're passing in non-subsampled coordinates
                if (need_mc_border(chroma_mv[b],
                        x + (b & 1) * 8, y + (b >> 1) * 8, 16, w, h))
                {
                    this_.base.need_mc_border = 1;
                    break;
                }
            }

            return; //skip need_mc_border check
        }
        default:
            throw "ERROR:(";
    }

    if (need_mc_border(this_.base.mv, x, y, 16, w, h))
        this_.base.need_mc_border = 1;
}

var bounds_modemv_process = {
        to_left: 0,
        to_right: 0,
        to_top: 0,
        to_bottom: 0
    };


    

function  decode_intra_mb_mode(this_, hdr, bool) {

    var y_mode = 0, uv_mode = 0;

    y_mode = bool.read_tree(TABLES.y_mode_tree, hdr.y_mode_probs);

    if (y_mode === B_PRED) {
        var i = 0;

        for (i = 0; i < 16; i++) {
            var b;//enum ='prediction_mode'

            b = bool.read_tree(b_mode_tree, TABLES.default_b_mode_probs);
            this_.splitt.modes[i] = this_.splitt.mvs[i].x = b;
            this_.splitt.mvs[i].y = 0;
        }
    }

    uv_mode = bool.read_tree(TABLES.uv_mode_tree, hdr.uv_mode_probs);

    this_.base.y_mode = y_mode;
    this_.base.uv_mode = uv_mode;
    this_.base.mv.x = this_.base.mv.y = 0;
    this_.base.ref_frame = CURRENT_FRAME;
}




function vp8_dixie_modemv_process_row(ctx, bool, row, start_col, num_cols) {
    var above, above_off = 0, this_, this_off = 0;
    var col = 0;

    var bounds = bounds_modemv_process;
    
    this_ = ctx.mb_info_rows; //[1 + row];
    this_off = ctx.mb_info_rows_off[1 + row] + start_col;
    above = ctx.mb_info_rows; //[1 + row - 1];
    above_off = ctx.mb_info_rows_off[row] + start_col;
    
    // Calculate the eighth-pel MV bounds using a 1 MB border.
    bounds.to_left = -((start_col + 1) << 7);
    bounds.to_right = (ctx.mb_cols - start_col) << 7;
    bounds.to_top = -((row + 1) << 7);
    bounds.to_bottom = (ctx.mb_rows - row) << 7;
    
    //always starts at 0, not sure what the point of start_col is
    
    for (col = start_col; col < start_col + num_cols; col++) {
        
    

        read_mb_features(bool, this_[this_off], ctx.segment_hdr);
         
        if (ctx.entropy_hdr.coeff_skip_enabled === 1)
            this_[this_off].base.skip_coeff = bool.get_prob(ctx.entropy_hdr.coeff_skip_prob);

        
        if (ctx.frame_hdr.is_keyframe === true) {
            if (ctx.segment_hdr.update_map === 0)
                this_[this_off].base.segment_id = 0;

            decode_kf_mb_mode(this_, this_off, this_, this_off - 1, above, above_off, bool);
        } else {
            if (bool.get_prob(ctx.entropy_hdr.prob_inter) > 0)
                decode_mvs(ctx, this_, this_off, this_, this_off - 1, above, above_off, bounds, bool);
            else
                decode_intra_mb_mode(this_[this_off], ctx.entropy_hdr, bool);

            bounds.to_left -= 16 << 3;
            bounds.to_right -= 16 << 3;
        }
        

        // Advance to next mb
        
        this_off++;
        above_off++;
    }
    
}

var vp8_entropymodedata = require("./common/vp8_entropymodedata");
var vp8_kf_bmode_prob = vp8_entropymodedata.vp8_kf_bmode_prob;



/*
 * was dequant_init
 * likely vp8cx_init_de_quantizer
 * @param {type} factors
 * @param {type} seg
 * @param {type} quant_hdr
 * @returns {undefined}
 */
function vp8cx_init_de_quantizer(factors, seg, quant_hdr) {
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

        this.mb_info_storage = null;
        this.mb_info_storage_off = 0;
        this.mb_info_rows = null; //mb_info**
        this.mb_info_rows_off = 0;
        
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
        
        
        this.Width = 0;
        this.Height = 0;
        this.horiz_scale = 0;
        this.vert_scale = 0;
        this.show_frame = 0;
        
        this.version = 0;
  

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
        vp8cx_init_de_quantizer(this.dequant_factors, this.segment_hdr, this.quant_hdr);
    }
    
    vp8_dixie_modemv_process_row(ctx, bool, row, start_col, num_cols){
        vp8_dixie_modemv_process_row(ctx, bool, row, start_col, num_cols);
    }
}


module.exports = Vp8;