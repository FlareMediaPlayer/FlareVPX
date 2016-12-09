'use strict';

var vp8_entropymodedata = require("../common/vp8_entropymodedata");
var vp8_kf_bmode_prob = vp8_entropymodedata.vp8_kf_bmode_prob;
var TABLES = require('../Tables.js');

var b_mode_tree = TABLES.b_mode_tree;
var kf_y_mode_tree = TABLES.kf_y_mode_tree;
var kf_y_mode_probs = TABLES.kf_y_mode_probs;

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

var B_DC_PRED = 0; /* average of above and left pixels */
var B_TM_PRED = 1;
var B_VE_PRED = 2; /* vertical prediction */
var B_HE_PRED = 3; /* horizontal prediction */
var LEFT4X4 = 10;
var ABOVE4X4 = 11;
var ZERO4X4 = 12;
var NEW4X4 = 13;
var B_MODE_COUNT = 14;

function above_block_mode(this_, above, b) {
    if (b < 4) {
        switch (above.base.y_mode)
        {
            case DC_PRED:
                return B_DC_PRED;
            case V_PRED:
                return B_VE_PRED;
            case H_PRED:
                return B_HE_PRED;
            case TM_PRED:
                return B_TM_PRED;
            case B_PRED:
                return above.splitt.mvs[b + 12].x;
            default:
                throw "ERROR :(";
        }
    }

    return this_.splitt.mvs[b - 4].x;
}



function left_block_mode(this_, left, b) {
    if (!(b & 3))
    {
        switch (left.base.y_mode)
        {
            case DC_PRED:
                return B_DC_PRED;
            case V_PRED:
                return B_VE_PRED;
            case H_PRED:
                return B_HE_PRED;
            case TM_PRED:
                return B_TM_PRED;
            case B_PRED:
                return left.splitt.mvs[b + 3].x;
            default:
                throw "ERROR :(";
        }
    }

    return this_.splitt.mvs[b - 1].x;
}

/*
 * read_segment_id
 * vp8_reader *r, MB_MODE_INFO *mi, MACROBLOCKD *x
 * passing in segment header for now
 */
function read_mb_features(r, mi, x) {
    // Is segmentation enabled 
    if (x.enabled && x.update_map) {
        
        // If so then read the segment id. 
        if (r.get_prob( x.tree_probs[0]) === 1) {
            mi.base.segment_id = 2 + r.get_prob(x.tree_probs[2]);
        } else {
            mi.base.segment_id = r.get_prob(x.tree_probs[1]);
        }
        
    }
}

/**
 * read_kf_modes
 * @param {type} this_
 * @param {type} this_off
 * @param {type} left
 * @param {type} left_off
 * @param {type} above
 * @param {type} above_off
 * @param {type} bool
 * @returns {undefined}
 */
function decode_kf_mb_mode(this_, this_off, 
        left, left_off, 
        above, above_off, 
        bool) {
    var y_mode = 0;
    var uv_mode = 0;

    y_mode = bool.read_tree(kf_y_mode_tree, kf_y_mode_probs);

    if (y_mode === B_PRED) {
        var i = 0;

        for (i = 0; i < 16; i++)
        {
            var a = above_block_mode(this_[this_off], above[above_off], i);
            var l = left_block_mode(this_[this_off], left[left_off], i);
            var b = 0;//enum prediction_mode

            b = bool.read_tree(TABLES.b_mode_tree,
                    vp8_kf_bmode_prob[a][l]);
            this_[this_off].splitt.modes[i] = this_[this_off].splitt.mvs[i].x = b;
            this_[this_off].splitt.mvs[i].y = 0;
        }
    }

    uv_mode = bool.read_tree(TABLES.uv_mode_tree, TABLES.kf_uv_mode_probs);

    this_[this_off].base.y_mode = y_mode;
    this_[this_off].base.uv_mode = uv_mode;
    this_[this_off].base.mv.x = this_[this_off].base.mv.y = 0;//raw = 0;
    this_[this_off].base.ref_frame = 0;
}


module.exports = {};
module.exports.read_mb_features = read_mb_features;
module.exports.decode_kf_mb_mode = decode_kf_mb_mode;