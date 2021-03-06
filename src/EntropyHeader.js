'use strict';
var TABLES = require('./Tables.js');
var k_default_mv_probs = TABLES.k_default_mv_probs;
var default_coef_probs = require('./common/default_coef_probs.js');
var vp8_coef_update_probs = require('./common/coefupdateprobs.js');

var entropymv = require('./common/entropymv.js');
var vp8_mv_update_probs = entropymv.vp8_mv_update_probs;
var vp8_default_mv_context = entropymv.vp8_default_mv_context;

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
        var probs;
        //load coef probs
       //if(md5(TABLES.k_default_coeff_probs_32) !== md5(TABLES.k_default_coeff_probs))
         //   console.warn("Invalid copy");
        
        /*
        var probs = TABLES.k_default_coeff_probs_32;
        var probs = TABLES.k_default_coeff_probs;
        var i = 1056;
        while (i--)
            this.coeff_probs[i] = probs[i];
        */
        
       
       
        //var probs = TABLES.k_default_coeff_probs_32;
        //var probs = TABLES.k_default_coeff_probs;
        //var i = 1056;
        //while (i--)
          //  this.coeff_probs[i] = probs[i];
          
        for(var i = 0; i < 1056; i++){
            this.coeff_probs[i] = default_coef_probs[i];
            //console.warn(this.coeff_probs_32);
            //console.warn(TABLES.k_default_coeff_probs_32);
            //throw "er";
        }
        /*
        for(var i = 0; i < 1056; i++){
            if(this.coeff_probs[i] !== TABLES.k_default_coeff_probs[i] ){
                console.warn("invalid at : " + i);
            }
        }
        */
       
        //this.coeff_probs = TABLES.k_default_coeff_probs.sl
        //this.coeff_probs[0] = probs[0];
        
        /*
        var i = 264;
        var coeff_probs_32 = this.coeff_probs_32;
        while (i--)
            coeff_probs_32[i] = probs[i];
        */
       //this.coeff_probs = probs.slice();
        
        //load mv probs
        probs = vp8_default_mv_context;
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

        
        for(var i = 0; i < 1056; i++) {
            if (bool.get_prob(vp8_coef_update_probs[i]) === 1)
                coeff_probs[i] = bool.get_uint(8);
        }

       
        /* Read coefficient skip mode probability */
        this.coeff_skip_enabled = bool.get_bit();

        if (this.coeff_skip_enabled === 1)
            this.coeff_skip_prob = bool.get_uint(8);
        else
            this.coeff_skip_prob = 0;

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
                    if (bool.get_prob(vp8_mv_update_probs[i][j]))
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
    
    copyValues(otherHeader) {
        //console.warn("-----------------------COPYING VALUES--------------------");
        var probs = otherHeader.coeff_probs;
        this.coeff_probs = otherHeader.coeff_probs.slice(0);
                /*
                 var i = 1056;
                 while (i--)
            this.coeff_probs[i] = probs[i];
        */
        
        
        //this.coeff_probs = TABLES.k_default_coeff_probs.sl
        //this.coeff_probs[0] = probs[0];
        
        /*
        var i = 264;
        var coeff_probs_32 = this.coeff_probs_32;
        while (i--)
            coeff_probs_32[i] = probs[i];
        */
       //this.coeff_probs = probs.slice();
        
        //load mv probs
        probs = otherHeader.mv_probs;
        //this can probably be done faster
        for (var i = 0; i < MV_PROB_CNT; i++)
            this.mv_probs[0][i] = probs[0][i];

        for (var i = 0; i < MV_PROB_CNT; i++)
            this.mv_probs[1][i] = probs[1][i];

        //load y mode probs
        probs = otherHeader.y_mode_probs_32;
        this.y_mode_probs_32[0] = probs[0];



        //load uv mode probs
        probs = otherHeader.uv_mode_probs;
        //for (var i = 0; i < 3; i++)
        this.uv_mode_probs[0] = probs[0];
        this.uv_mode_probs[1] = probs[1];
        this.uv_mode_probs[2] = probs[2];
        
        
        this.prob_inter = otherHeader.prob_inter;
        this.prob_last = otherHeader.prob_inter;
        this.prob_gf = otherHeader.prob_inter;
    }
}

module.exports = EntropyHeader;