var MotionVector = require('./MotionVector.js');
var TABLES = require('./Tables.js');

var CURRENT_FRAME = 0;
var LAST_FRAME = 1;
var GOLDEN_FRAME = 2;
var ALTREF_FRAME = 3;
var NUM_REF_FRAMES = 4;


var BORDER_PIXELS = 16;


var B_DC_PRED = 0;
var B_TM_PRED = 1;
var B_VE_PRED = 2;
var B_HE_PRED = 3;
var B_LD_PRED = 4;
var B_RD_PRED = 5;
var B_VR_PRED = 6;
var B_VL_PRED = 7;
var B_HD_PRED = 8;
var B_HU_PRED = 9;


var VPX_IMG_FMT_I420 = 258;
var VPX_IMG_FMT_VPXI420 = 260;


var VPX_PLANE_PACKED = 0;
var VPX_PLANE_Y = 0;
var VPX_PLANE_U = 1;  
var VPX_PLANE_V = 2; 
var VPX_PLANE_ALPHA = 3;  
var PLANE_PACKED = VPX_PLANE_PACKED;
var PLANE_Y = VPX_PLANE_Y;
var PLANE_U = VPX_PLANE_U;
var PLANE_V = VPX_PLANE_V;
var PLANE_ALPHA = VPX_PLANE_ALPHA;

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




function vpx_img_free(img) {
    if (img)
    {
        if (img.img_data && img.img_data_owner)
            img.img_data = null;

        if (img.self_allocd)
            img = null;
    }
}

function vp8_dixie_release_ref_frame(rcimg) {
    if (rcimg)
    {
        if(rcimg.ref_cnt === 0)
            throw "ERROR :(";
        rcimg.ref_cnt--;
    }
}

function vp8_dixie_find_free_ref_frame(frames) {
    var i = 0;

    for (i = 0; i < NUM_REF_FRAMES; i++)
        if (frames[i].ref_cnt === 0) {
            frames[i].ref_cnt = 1;
            return frames[i];
        }

    return null;
}

function vp8_dixie_predict_init(ctx) {

    var i = 0;
    var this_frame_base = 0;
    var this_frame_base_off = 0;

    if (ctx.frame_hdr.frame_size_updated === 1) {
        
        for (i = 0; i < NUM_REF_FRAMES; i++) {
            
            var w = ((ctx.mb_cols << 4) + 32)|0; 
            var h = ((ctx.mb_rows  << 4) + 32)|0;

            vpx_img_free(ctx.frame_strg[i].img);
            ctx.frame_strg[i].ref_cnt = 0;
            ctx.ref_frames[i] = null;

            if (!ctx.frame_strg[i].img.init( VPX_IMG_FMT_I420, w, h, 16))
                throw "Memory Error!";
            
            ctx.frame_strg[i].img.setRect(BORDER_PIXELS, BORDER_PIXELS,
                    ctx.frame_hdr.kf.w, ctx.frame_hdr.kf.h);

        }

        if (ctx.frame_hdr.version)
            ctx.subpixel_filters = TABLES.bilinear_filters;
        else
            ctx.subpixel_filters = TABLES.sixtap_filters;
    }

    var ref_frames = ctx.ref_frames;
    /* Find a free framebuffer to predict into */
    if (ref_frames[CURRENT_FRAME])
        vp8_dixie_release_ref_frame(ref_frames[CURRENT_FRAME]);

    ref_frames[CURRENT_FRAME] =
            vp8_dixie_find_free_ref_frame(ctx.frame_strg);
    this_frame_base = ref_frames[CURRENT_FRAME].img.img_data;

    /* Calculate offsets to the other reference frames */
    
    for (i = 0; i < NUM_REF_FRAMES; i++) {
        var ref = ref_frames[i];

        if(ref){
            ctx.ref_frame_offsets[i] = ref.img.img_data_off - this_frame_base_off;
            ctx.ref_frame_offsets_[i] = ref.img.img_data;
        }else{
            ctx.ref_frame_offsets[i] = 0;
            ctx.ref_frame_offsets_[i] = this_frame_base;
        }
    }

  
}



module.exports = {};
module.exports.vp8_dixie_predict_init = vp8_dixie_predict_init;