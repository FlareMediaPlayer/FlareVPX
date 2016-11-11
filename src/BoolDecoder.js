'use strict';



class BoolDecoder {

    constructor() {
        this.input = 0;
        this.ptr = 0; //dont need
        this.input_len = 0;
        this.range = 0;
        this.value = 0;
        this.bit_count = 0;
    }

    /**
     * init_bool_decoder
     * checkout vp8dx_start_decode
     */
    init(start_partition, ptr, sz) {
        
        if (sz >= 2) {
            this.value = (start_partition[ptr] << 8) | start_partition[ptr + 1];
            this.input = start_partition;
            this.ptr = (ptr + 2)|0;
            this.input_len = (sz - 2) | 0;
        } else {
            this.value = 0;
            this.input = null;
            this.input_len = 0;
        }

        this.range = 255;    
        this.bit_count = 0;
    }

    /**
     * bool_get
     * @param {type} probability
     * @returns {Number}
     */
    get_prob(probability) {
        var split = 1 + (((this.range - 1) * probability) >> 8);
        var SPLIT = split << 8;
        var retval = 0;          

        if (this.value >= SPLIT){
            retval = 1;
            this.range -= split;  
            this.value -= SPLIT;  
        } else  {
            retval = 0;
            this.range = split;
        }

        while (this.range < 128) {
            this.value <<= 1;
            this.range <<= 1;
            if (++this.bit_count === 8){
                this.bit_count = 0;
                if (this.input_len) {
                    this.value |= this.input[this.ptr++];
                    this.input_len--;
                }
            }
        }
        return retval;
    }

    get_bit() {
        return this.get_prob(128);
    }

    get_uint(bits) {
        var z = 0;
        var bit = 0;

        for (bit = bits - 1; bit >= 0; bit--) {
            z |= (this.get_bit() << bit);
        }

        return z | 0; 
    }

    /*
     * bool_get_int
     * @param {type} bits
     * @returns {BoolDecoder.get_int.z|Number}
     */
    get_int(bits) {
        var z = 0;
        var bit = 0;

        for (bit = bits - 1; bit >= 0; bit--)
        {
            z |= (this.get_bit() << bit);
        }
        
        return this.get_bit() ? -z : z;
    }

    maybe_get_int(bits) {
        /*
        if(this.get_bit() === 1){
            return this.get_int(bits)|0;
        }else{
            return 0;
        }
        */
       return this.get_bit() ? this.get_int(bits) : 0;
    }

    read_tree(t, p, p_off) {
        var i = 0;

        if (typeof p_off !== 'undefined')
            while ((i = t[ i + this.get_prob(p[p_off + (i >> 1)])]) > 0){}
                
        else
            while ((i = t[ i + this.get_prob(p[i >> 1])]) > 0){}
                

        return (-i) | 0;
    }

}









module.exports = BoolDecoder;