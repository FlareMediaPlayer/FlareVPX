'use strict';
var CURRENT_FRAME = 0;
var LAST_FRAME = 1;
var GOLDEN_FRAME = 2;
var ALTREF_FRAME = 3;
var NUM_REF_FRAMES = 4;
        
//vp8_reference_hdr
class ReferenceHeader {
    
    constructor(decoder) {
        this.decoder = decoder;
        this.refresh_last = 0;
        this.refresh_gf = 0; //1
        this.refresh_arf = 0; // 2
        this.copy_gf = 0; //3
        this.copy_arf = 0; //4
        this.sign_bias = new Int32Array(4);
        this.refresh_entropy = 0; //5
    }
    
    decode(bool) {
        var key = this.decoder.frame_hdr.is_keyframe;

        if(key === true){
            this.refresh_gf = 1;
        }else{
            this.refresh_gf = bool.get_bit();
        }
        

        if(key === true){
            this.refresh_arf = 1;
        }else{
            this.refresh_arf = bool.get_bit();
        }
        

                
        if (key === true) {
            this.copy_gf = 0;
        } else {
            this.copy_gf = !this.refresh_gf
                    ? bool.get_uint(2) : 0;
        }
                

        if (key === true) {
            this.copy_arf = 0;
        } else {
            this.copy_arf = !this.refresh_arf
                    ? bool.get_uint(2) : 0;
        }
                

        if(key === true){
            this.sign_bias[GOLDEN_FRAME] = 0;
        }else{
            this.sign_bias[GOLDEN_FRAME] = bool.get_bit();
        }  


        if(key === true){
            this.sign_bias[ALTREF_FRAME] = 0;
        }else{
            this.sign_bias[ALTREF_FRAME] = bool.get_bit();
        }
        
        this.refresh_entropy = bool.get_bit();

        if(key === true){
            this.refresh_last = 1;
        }else{
            this.refresh_last = bool.get_bit();
        }
        
        
    }
}

module.exports = ReferenceHeader;