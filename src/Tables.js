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

TABLES.k_mv_entropy_update_probs =
        [
            new Uint8Array([
                237,
                246,
                253, 253, 254, 254, 254, 254, 254,
                254, 254, 254, 254, 254, 250, 250, 252, 254, 254
            ]),
            new Uint8Array([
                231,
                243,
                245, 253, 254, 254, 254, 254, 254,
                254, 254, 254, 254, 254, 251, 251, 254, 254, 254
            ])
        ];

TABLES.k_default_y_mode_probs = new Uint8Array([112, 86, 140, 37]);
TABLES.k_default_y_mode_probs_32 = new Uint32Array(TABLES.k_default_y_mode_probs.buffer);

TABLES.k_default_uv_mode_probs = new Uint8Array([162, 101, 204]);

TABLES.k_default_mv_probs =
        [
            new Uint8Array([// row
                162, // is short
                128, // sign
                225, 146, 172, 147, 214, 39, 156, // short tree
                128, 129, 132, 75, 145, 178, 206, 239, 254, 254 // long bits
            ]),
            new Uint8Array([
                164,
                128,
                204, 170, 119, 235, 140, 230, 228,
                128, 130, 130, 74, 148, 180, 203, 236, 254, 254

            ])
        ];


TABLES.dc_q_lookup =
        new Int32Array([
            4, 5, 6, 7, 8, 9, 10, 10,
            11, 12, 13, 14, 15, 16, 17, 17,
            18, 19, 20, 20, 21, 21, 22, 22,
            23, 23, 24, 25, 25, 26, 27, 28,
            29, 30, 31, 32, 33, 34, 35, 36,
            37, 37, 38, 39, 40, 41, 42, 43,
            44, 45, 46, 46, 47, 48, 49, 50,
            51, 52, 53, 54, 55, 56, 57, 58,
            59, 60, 61, 62, 63, 64, 65, 66,
            67, 68, 69, 70, 71, 72, 73, 74,
            75, 76, 76, 77, 78, 79, 80, 81,
            82, 83, 84, 85, 86, 87, 88, 89,
            91, 93, 95, 96, 98, 100, 101, 102,
            104, 106, 108, 110, 112, 114, 116, 118,
            122, 124, 126, 128, 130, 132, 134, 136,
            138, 140, 143, 145, 148, 151, 154, 157
        ]);

TABLES.ac_q_lookup =
        new Int32Array([
            4, 5, 6, 7, 8, 9, 10, 11,
            12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27,
            28, 29, 30, 31, 32, 33, 34, 35,
            36, 37, 38, 39, 40, 41, 42, 43,
            44, 45, 46, 47, 48, 49, 50, 51,
            52, 53, 54, 55, 56, 57, 58, 60,
            62, 64, 66, 68, 70, 72, 74, 76,
            78, 80, 82, 84, 86, 88, 90, 92,
            94, 96, 98, 100, 102, 104, 106, 108,
            110, 112, 114, 116, 119, 122, 125, 128,
            131, 134, 137, 140, 143, 146, 149, 152,
            155, 158, 161, 164, 167, 170, 173, 177,
            181, 185, 189, 193, 197, 201, 205, 209,
            213, 217, 221, 225, 229, 234, 239, 245,
            249, 254, 259, 264, 269, 274, 279, 284
        ]);





TABLES.kf_y_mode_probs = new Uint8Array([145, 156, 163, 128]);

TABLES.kf_uv_mode_probs = new Uint8Array([142, 114, 183]);

TABLES.kf_b_mode_probs =
        [
            [/* above mode 0 */
                new Uint8Array([/* left mode 0 */ 231, 120, 48, 89, 115, 113, 120, 152, 112]),
                new Uint8Array([/* left mode 1 */ 152, 179, 64, 126, 170, 118, 46, 70, 95]),
                new Uint8Array([/* left mode 2 */ 175, 69, 143, 80, 85, 82, 72, 155, 103]),
                new Uint8Array([/* left mode 3 */ 56, 58, 10, 171, 218, 189, 17, 13, 152]),
                new Uint8Array([/* left mode 4 */ 144, 71, 10, 38, 171, 213, 144, 34, 26]),
                new Uint8Array([/* left mode 5 */ 114, 26, 17, 163, 44, 195, 21, 10, 173]),
                new Uint8Array([/* left mode 6 */ 121, 24, 80, 195, 26, 62, 44, 64, 85]),
                new Uint8Array([/* left mode 7 */ 170, 46, 55, 19, 136, 160, 33, 206, 71]),
                new Uint8Array([/* left mode 8 */ 63, 20, 8, 114, 114, 208, 12, 9, 226]),
                new Uint8Array([/* left mode 9 */ 81, 40, 11, 96, 182, 84, 29, 16, 36])
            ],
            [/* above mode 1 */
                new Uint8Array([/* left mode 0 */ 134, 183, 89, 137, 98, 101, 106, 165, 148]),
                new Uint8Array([/* left mode 1 */ 72, 187, 100, 130, 157, 111, 32, 75, 80]),
                new Uint8Array([/* left mode 2 */ 66, 102, 167, 99, 74, 62, 40, 234, 128]),
                new Uint8Array([/* left mode 3 */ 41, 53, 9, 178, 241, 141, 26, 8, 107]),
                new Uint8Array([/* left mode 4 */ 104, 79, 12, 27, 217, 255, 87, 17, 7]),
                new Uint8Array([/* left mode 5 */ 74, 43, 26, 146, 73, 166, 49, 23, 157]),
                new Uint8Array([/* left mode 6 */ 65, 38, 105, 160, 51, 52, 31, 115, 128]),
                new Uint8Array([/* left mode 7 */ 87, 68, 71, 44, 114, 51, 15, 186, 23]),
                new Uint8Array([/* left mode 8 */ 47, 41, 14, 110, 182, 183, 21, 17, 194]),
                new Uint8Array([/* left mode 9 */ 66, 45, 25, 102, 197, 189, 23, 18, 22])
            ],
            [/* above mode 2 */
                new Uint8Array([/* left mode 0 */ 88, 88, 147, 150, 42, 46, 45, 196, 205]),
                new Uint8Array([/* left mode 1 */ 43, 97, 183, 117, 85, 38, 35, 179, 61]),
                new Uint8Array([/* left mode 2 */ 39, 53, 200, 87, 26, 21, 43, 232, 171]),
                new Uint8Array([/* left mode 3 */ 56, 34, 51, 104, 114, 102, 29, 93, 77]),
                new Uint8Array([/* left mode 4 */ 107, 54, 32, 26, 51, 1, 81, 43, 31]),
                new Uint8Array([/* left mode 5 */ 39, 28, 85, 171, 58, 165, 90, 98, 64]),
                new Uint8Array([/* left mode 6 */ 34, 22, 116, 206, 23, 34, 43, 166, 73]),
                new Uint8Array([/* left mode 7 */ 68, 25, 106, 22, 64, 171, 36, 225, 114]),
                new Uint8Array([/* left mode 8 */ 34, 19, 21, 102, 132, 188, 16, 76, 124]),
                new Uint8Array([/* left mode 9 */ 62, 18, 78, 95, 85, 57, 50, 48, 51])
            ],
            [/* above mode 3 */
                new Uint8Array([/* left mode 0 */ 193, 101, 35, 159, 215, 111, 89, 46, 111]),
                new Uint8Array([/* left mode 1 */ 60, 148, 31, 172, 219, 228, 21, 18, 111]),
                new Uint8Array([/* left mode 2 */ 112, 113, 77, 85, 179, 255, 38, 120, 114]),
                new Uint8Array([/* left mode 3 */ 40, 42, 1, 196, 245, 209, 10, 25, 109]),
                new Uint8Array([/* left mode 4 */ 100, 80, 8, 43, 154, 1, 51, 26, 71]),
                new Uint8Array([/* left mode 5 */ 88, 43, 29, 140, 166, 213, 37, 43, 154]),
                new Uint8Array([/* left mode 6 */ 61, 63, 30, 155, 67, 45, 68, 1, 209]),
                new Uint8Array([/* left mode 7 */ 142, 78, 78, 16, 255, 128, 34, 197, 171]),
                new Uint8Array([/* left mode 8 */ 41, 40, 5, 102, 211, 183, 4, 1, 221]),
                new Uint8Array([/* left mode 9 */ 51, 50, 17, 168, 209, 192, 23, 25, 82])
            ],
            [/* above mode 4 */
                new Uint8Array([/* left mode 0 */ 125, 98, 42, 88, 104, 85, 117, 175, 82]),
                new Uint8Array([/* left mode 1 */ 95, 84, 53, 89, 128, 100, 113, 101, 45]),
                new Uint8Array([/* left mode 2 */ 75, 79, 123, 47, 51, 128, 81, 171, 1]),
                new Uint8Array([/* left mode 3 */ 57, 17, 5, 71, 102, 57, 53, 41, 49]),
                new Uint8Array([/* left mode 4 */ 115, 21, 2, 10, 102, 255, 166, 23, 6]),
                new Uint8Array([/* left mode 5 */ 38, 33, 13, 121, 57, 73, 26, 1, 85]),
                new Uint8Array([/* left mode 6 */ 41, 10, 67, 138, 77, 110, 90, 47, 114]),
                new Uint8Array([/* left mode 7 */ 101, 29, 16, 10, 85, 128, 101, 196, 26]),
                new Uint8Array([/* left mode 8 */ 57, 18, 10, 102, 102, 213, 34, 20, 43]),
                new Uint8Array([/* left mode 9 */ 117, 20, 15, 36, 163, 128, 68, 1, 26])
            ],
            [/* above mode 5 */
                new Uint8Array([/* left mode 0 */ 138, 31, 36, 171, 27, 166, 38, 44, 229]),
                new Uint8Array([/* left mode 1 */ 67, 87, 58, 169, 82, 115, 26, 59, 179]),
                new Uint8Array([/* left mode 2 */ 63, 59, 90, 180, 59, 166, 93, 73, 154]),
                new Uint8Array([/* left mode 3 */ 40, 40, 21, 116, 143, 209, 34, 39, 175]),
                new Uint8Array([/* left mode 4 */ 57, 46, 22, 24, 128, 1, 54, 17, 37]),
                new Uint8Array([/* left mode 5 */ 47, 15, 16, 183, 34, 223, 49, 45, 183]),
                new Uint8Array([/* left mode 6 */ 46, 17, 33, 183, 6, 98, 15, 32, 183]),
                new Uint8Array([/* left mode 7 */ 65, 32, 73, 115, 28, 128, 23, 128, 205]),
                new Uint8Array([/* left mode 8 */ 40, 3, 9, 115, 51, 192, 18, 6, 223]),
                new Uint8Array([/* left mode 9 */ 87, 37, 9, 115, 59, 77, 64, 21, 47])
            ],
            [/* above mode 6 */
                new Uint8Array([/* left mode 0 */ 104, 55, 44, 218, 9, 54, 53, 130, 226]),
                new Uint8Array([/* left mode 1 */ 64, 90, 70, 205, 40, 41, 23, 26, 57]),
                new Uint8Array([/* left mode 2 */ 54, 57, 112, 184, 5, 41, 38, 166, 213]),
                new Uint8Array([/* left mode 3 */ 30, 34, 26, 133, 152, 116, 10, 32, 134]),
                new Uint8Array([/* left mode 4 */ 75, 32, 12, 51, 192, 255, 160, 43, 51]),
                new Uint8Array([/* left mode 5 */ 39, 19, 53, 221, 26, 114, 32, 73, 255]),
                new Uint8Array([/* left mode 6 */ 31, 9, 65, 234, 2, 15, 1, 118, 73]),
                new Uint8Array([/* left mode 7 */ 88, 31, 35, 67, 102, 85, 55, 186, 85]),
                new Uint8Array([/* left mode 8 */ 56, 21, 23, 111, 59, 205, 45, 37, 192]),
                new Uint8Array([/* left mode 9 */ 55, 38, 70, 124, 73, 102, 1, 34, 98])
            ],
            [/* above mode 7 */
                new Uint8Array([/* left mode 0 */ 102, 61, 71, 37, 34, 53, 31, 243, 192]),
                new Uint8Array([/* left mode 1 */ 69, 60, 71, 38, 73, 119, 28, 222, 37]),
                new Uint8Array([/* left mode 2 */ 68, 45, 128, 34, 1, 47, 11, 245, 171]),
                new Uint8Array([/* left mode 3 */ 62, 17, 19, 70, 146, 85, 55, 62, 70]),
                new Uint8Array([/* left mode 4 */ 75, 15, 9, 9, 64, 255, 184, 119, 16]),
                new Uint8Array([/* left mode 5 */ 37, 43, 37, 154, 100, 163, 85, 160, 1]),
                new Uint8Array([/* left mode 6 */ 63, 9, 92, 136, 28, 64, 32, 201, 85]),
                new Uint8Array([/* left mode 7 */ 86, 6, 28, 5, 64, 255, 25, 248, 1]),
                new Uint8Array([/* left mode 8 */ 56, 8, 17, 132, 137, 255, 55, 116, 128]),
                new Uint8Array([/* left mode 9 */ 58, 15, 20, 82, 135, 57, 26, 121, 40])
            ],
            [/* above mode 8 */
                new Uint8Array([/* left mode 0 */ 164, 50, 31, 137, 154, 133, 25, 35, 218]),
                new Uint8Array([/* left mode 1 */ 51, 103, 44, 131, 131, 123, 31, 6, 158]),
                new Uint8Array([/* left mode 2 */ 86, 40, 64, 135, 148, 224, 45, 183, 128]),
                new Uint8Array([/* left mode 3 */ 22, 26, 17, 131, 240, 154, 14, 1, 209]),
                new Uint8Array([/* left mode 4 */ 83, 12, 13, 54, 192, 255, 68, 47, 28]),
                new Uint8Array([/* left mode 5 */ 45, 16, 21, 91, 64, 222, 7, 1, 197]),
                new Uint8Array([/* left mode 6 */ 56, 21, 39, 155, 60, 138, 23, 102, 213]),
                new Uint8Array([/* left mode 7 */ 85, 26, 85, 85, 128, 128, 32, 146, 171]),
                new Uint8Array([/* left mode 8 */ 18, 11, 7, 63, 144, 171, 4, 4, 246]),
                new Uint8Array([/* left mode 9 */ 35, 27, 10, 146, 174, 171, 12, 26, 128])
            ],
            [/* above mode 9 */
                new Uint8Array([/* left mode 0 */ 190, 80, 35, 99, 180, 80, 126, 54, 45]),
                new Uint8Array([/* left mode 1 */ 85, 126, 47, 87, 176, 51, 41, 20, 32]),
                new Uint8Array([/* left mode 2 */ 101, 75, 128, 139, 118, 146, 116, 128, 85]),
                new Uint8Array([/* left mode 3 */ 56, 41, 15, 176, 236, 85, 37, 9, 62]),
                new Uint8Array([/* left mode 4 */ 146, 36, 19, 30, 171, 255, 97, 27, 20]),
                new Uint8Array([/* left mode 5 */ 71, 30, 17, 119, 118, 255, 17, 18, 138]),
                new Uint8Array([/* left mode 6 */ 101, 38, 60, 138, 55, 70, 43, 26, 142]),
                new Uint8Array([/* left mode 7 */ 138, 45, 61, 62, 219, 1, 81, 188, 64]),
                new Uint8Array([/* left mode 8 */ 32, 41, 20, 117, 151, 142, 20, 21, 163]),
                new Uint8Array([/* left mode 9 */ 112, 19, 12, 61, 195, 128, 48, 4, 24])
            ]
        ];

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