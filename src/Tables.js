'use strict';

var DC_PRED = 0;
var V_PRED = 1;
var H_PRED = 2; /* horizontal prediction */
var TM_PRED = 3; /* Truemotion prediction */
var B_PRED = 4; /* block based prediction, each block has its own prediction mode */
var NEARESTMV = 5;
var NEARMV = 6;
var ZEROMV = 7;
var NEWMV = 8;
var SPLITMV = 9;
var MB_MODE_COUNT = 10;


var B_DC_PRED = 0, /* average of above and left pixels */
        B_TM_PRED = 1,
        B_VE_PRED = 2, /* vertical prediction */
        B_HE_PRED = 3, /* horizontal prediction */

        B_LD_PRED = 4,
        B_RD_PRED = 5,
        B_VR_PRED = 6,
        B_VL_PRED = 7,
        B_HD_PRED = 8,
        B_HU_PRED = 9,
        LEFT4X4 = 10,
        ABOVE4X4 = 11,
        ZERO4X4 = 12,
        NEW4X4 = 13,
        B_MODE_COUNT = 14
        ;//} B_PREDICTION_MODE;


var TABLES = {};


TABLES.k_default_y_mode_probs = new Uint8Array([112, 86, 140, 37]);
TABLES.k_default_y_mode_probs_32 = new Uint32Array(TABLES.k_default_y_mode_probs.buffer);

TABLES.k_default_uv_mode_probs = new Uint8Array([162, 101, 204]);





TABLES.kf_y_mode_probs = new Uint8Array([145, 156, 163, 128]);

TABLES.kf_uv_mode_probs = new Uint8Array([142, 114, 183]);



TABLES.kf_y_mode_tree =
        new Int32Array([
            -B_PRED, 2,
            4, 6,
            -DC_PRED, -V_PRED,
            -H_PRED, -TM_PRED
        ]);

TABLES.y_mode_tree =
        new Int32Array([
            -DC_PRED, 2,
            4, 6,
            -V_PRED, -H_PRED,
            -TM_PRED, -B_PRED
        ]);

TABLES.uv_mode_tree =
        new Int32Array([
            -DC_PRED, 2,
            -V_PRED, 4,
            -H_PRED, -TM_PRED
        ]);

TABLES.b_mode_tree =
        new Int32Array([
            -B_DC_PRED, 2, /* 0 = DC_NODE */
            -B_TM_PRED, 4, /* 1 = TM_NODE */
            -B_VE_PRED, 6, /* 2 = VE_NODE */
            8, 12, /* 3 = COM_NODE */
            -B_HE_PRED, 10, /* 4 = HE_NODE */
            -B_RD_PRED, -B_VR_PRED, /* 5 = RD_NODE */
            -B_LD_PRED, 14, /* 6 = LD_NODE */
            -B_VL_PRED, 16, /* 7 = VL_NODE */
            -B_HD_PRED, -B_HU_PRED         /* 8 = HD_NODE */
        ]);



TABLES.small_mv_tree =
        new Int32Array([
            2, 8,
            4, 6,
            -0, -1,
            -2, -3,
            10, 12,
            -4, -5,
            -6, -7
        ]);

TABLES.mv_ref_tree = new Int32Array([
    -ZEROMV, 2,
    -NEARESTMV, 4,
    -NEARMV, 6,
    -NEWMV, -SPLITMV
]);



TABLES.submv_ref_tree = new Int32Array([
    -LEFT4X4, 2,
    -ABOVE4X4, 4,
    -ZERO4X4, -NEW4X4
]);


TABLES.split_mv_tree = new Int32Array([
    -3, 2,
    -2, 4,
    -0, -1
]);


TABLES.default_b_mode_probs =
        new Uint8Array([120, 90, 79, 133, 87, 85, 80, 111, 151]);

TABLES.mv_counts_to_probs =
        [
            new Uint8Array([7, 1, 1, 143]),
            new Uint8Array([14, 18, 14, 107]),
            new Uint8Array([135, 64, 57, 68]),
            new Uint8Array([60, 56, 128, 65]),
            new Uint8Array([159, 134, 128, 34]),
            new Uint8Array([234, 188, 128, 28])

        ];


TABLES.mv_partitions =
        [
            new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]),
            new Int32Array([0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1]),
            new Int32Array([0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3]),
            new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
        ];

TABLES.submv_ref_probs2 =
        [
            new Int32Array([147, 136, 18]),
            new Int32Array([106, 145, 1]),
            new Int32Array([179, 121, 1]),
            new Int32Array([223, 1, 34]),
            new Int32Array([208, 1, 1])
        ];

TABLES.sixtap_filters = //[8]
        [
            new Int16Array([, 0, 128, 0, 0, 0]),
            new Int16Array([0, -6, 123, 12, -1, 0]),
            new Int16Array([2, -11, 108, 36, -8, 1]),
            new Int16Array([0, -9, 93, 50, -6, 0]),
            new Int16Array([3, -16, 77, 77, -16, 3]),
            new Int16Array([0, -6, 50, 93, -9, 0]),
            new Int16Array([1, -8, 36, 108, -11, 2]),
            new Int16Array([0, -1, 12, 123, -6, 0])
        ];


TABLES.bilinear_filters = //filter_t [8]
        [
            new Int16Array([0, 0, 128, 0, 0, 0]),
            new Int16Array([0, 0, 112, 16, 0, 0]),
            new Int16Array([0, 0, 96, 32, 0, 0]),
            new Int16Array([0, 0, 80, 48, 0, 0]),
            new Int16Array([0, 0, 64, 64, 0, 0]),
            new Int16Array([0, 0, 48, 80, 0, 0]),
            new Int16Array([0, 0, 32, 96, 0, 0]),
            new Int16Array([0, 0, 16, 112, 0, 0])
        ];

TABLES.split_mv_probs =
        new Uint8Array([110, 111, 150]);

TABLES.left_context_index =
        new Uint32Array([
            0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3,
            4, 4, 5, 5, 6, 6, 7, 7, 8
        ]);

TABLES.above_context_index =
        new Uint32Array([
            0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3,
            4, 5, 4, 5, 6, 7, 6, 7, 8
        ]);

module.exports = TABLES;