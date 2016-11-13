'use strict';
var TABLES = require('./Tables.js');
var k_coeff_entropy_update_probs = TABLES.k_coeff_entropy_update_probs;
var k_mv_entropy_update_probs = TABLES.k_mv_entropy_update_probs;
var k_default_mv_probs = TABLES.k_default_mv_probs

var BLOCK_TYPES = 4;
var PREV_COEF_CONTEXTS = 3;
var COEF_BANDS = 8;
var ENTROPY_NODES = 11;


var MV_PROB_CNT =19;// 2 + 8 - 1 + 10;

/*
 *  struct vp8_entropy_hdr
   {
       coeff_probs_table_t   coeff_probs;
       mv_component_probs_t  mv_probs[2];
       unsigned int          coeff_skip_enabled;
       unsigned char         coeff_skip_prob;
       unsigned char         y_mode_probs[4];
       unsigned char         uv_mode_probs[3];
       unsigned char         prob_inter;
       unsigned char         prob_last;
       unsigned char         prob_gf;
   };

 enum
   {
       BLOCK_TYPES        = 4,
       PREV_COEFF_CONTEXTS = 3,
       COEFF_BANDS         = 8,
       ENTROPY_NODES      = 11,
   };
   typedef unsigned char coeff_probs_table_t[BLOCK_TYPES][COEFF_BANDS]
   [PREV_COEFF_CONTEXTS]
   [ENTROPY_NODES];

 */

class EntropyHeader {

    constructor(decoder) {
        this.decoder = decoder;
        //Coeff probs gets treated as a pointer later so cant use multi array anyway
        this.coeff_probs = new Uint8Array(1056);
        this.coeff_probs_32 = new Uint32Array(this.coeff_probs.buffer);
        //this.coeff_probs = null;
        this.mv_probs = [
            new Uint8Array(MV_PROB_CNT), //mv_component_probs_t
            new Uint8Array(MV_PROB_CNT) //mv_component_probs_t
        ];
        this.coeff_skip_enabled = 0;
        this.coeff_skip_prob = 0;
        this.y_mode_probs = new Uint8Array(4);
        this.y_mode_probs_32 = new Uint32Array(this.y_mode_probs.buffer);
        this.uv_mode_probs = new Uint8Array(3);
        this.prob_inter = 0;
        this.prob_last = 0;
        this.prob_gf = 0;
    }
    
    loadDefaultProbs() {
        //load coef probs
        var probs = TABLES.k_default_coeff_probs_32;

       
       /*
        var i = 1056;
        while (i--)
            this.coeff_probs[i] = probs[i];
        */
        
        var i = 264;
        var coeff_probs_32 = this.coeff_probs_32;
        while (i--)
            coeff_probs_32[i] = probs[i];
        
       //this.coeff_probs = probs.slice();
        
        //load mv probs
        probs = k_default_mv_probs;
        //this can probably be done faster
        for (var i = 0; i < MV_PROB_CNT; i++)
            this.mv_probs[0][i] = probs[0][i];

        for (var i = 0; i < MV_PROB_CNT; i++)
            this.mv_probs[1][i] = probs[1][i];

        //load y mode probs
        probs = TABLES.k_default_y_mode_probs_32;
        this.y_mode_probs_32[0] = probs[0];



        //load uv mode probs
        probs = TABLES.k_default_uv_mode_probs;
        //for (var i = 0; i < 3; i++)
        this.uv_mode_probs[0] = probs[0];
        this.uv_mode_probs[1] = probs[1];
        this.uv_mode_probs[2] = probs[2];
    }

    decode() {
        var decoder = this.decoder;
        var bool = decoder.boolDecoder;

        var i = 0, j = 0, k = 0, l = 0;
        var x = 0;

        var coeff_probs = this.coeff_probs;
        
        /* Read coefficient probability updates */
        for (i = 0; i < BLOCK_TYPES; i++)
            for (j = 0; j < COEF_BANDS; j++)
                for (k = 0; k < PREV_COEF_CONTEXTS; k++)
                    for (l = 0; l < ENTROPY_NODES; l++) {
                        if (bool.get_prob(k_coeff_entropy_update_probs[i][j][k][l]))
                            coeff_probs[x] = bool.get_uint(8);
                        x++;
                    }

        /* Read coefficient skip mode probability */
        this.coeff_skip_enabled = bool.get_bit();

        if (this.coeff_skip_enabled === 1)
            this.coeff_skip_prob = bool.get_uint(8);

        /* Parse interframe probability updates */
        if (decoder.frame_hdr.is_keyframe === false) {
            this.prob_inter = bool.get_uint(8);
            this.prob_last = bool.get_uint(8);
            this.prob_gf = bool.get_uint(8);

            if (bool.get_bit() === 1) {
                this.y_mode_probs[0] = bool.get_uint(8);
                this.y_mode_probs[1] = bool.get_uint(8);
                this.y_mode_probs[2] = bool.get_uint(8);
                this.y_mode_probs[3] = bool.get_uint(8);
            }

            if (bool.get_bit() === 1) {
                this.uv_mode_probs[0] = bool.get_uint(8);
                this.uv_mode_probs[1] = bool.get_uint(8);
                this.uv_mode_probs[2] = bool.get_uint(8);
            }

            for (i = 0; i < 2; i++)
                for (j = 0; j < MV_PROB_CNT; j++)
                    if (bool.get_prob(k_mv_entropy_update_probs[i][j]))
                    {
                        var x = bool.get_uint(7);
                        //this.mv_probs[i][j] = x ? x << 1 : 1;
                        if(x > 0){
                            this.mv_probs[i][j] = x << 1;
                        }else{
                            this.mv_probs[i][j] = 1;
                        }
                    }
        }
    }
}

module.exports = EntropyHeader;