'use strict';
var MAX_PARTITIONS = 8;

class TokenHeader {
    
    constructor(decoder) {
        this.decoder = decoder;
        this.partitions = 0;
        this.partition_sz = new Int32Array(MAX_PARTITIONS);

    }

    decode(data, ptr, sz) {
        var i = 0;
        var decoder = this.decoder;
        var bool = decoder.boolDecoder;
        this.partitions = 1 << bool.get_uint(2);
        var partitions = this.partitions;//cache 

        if (sz < 3 * (partitions - 1))
            throw "Truncated packet found parsing partition lenghts";

        sz -= 3 * (partitions - 1);

        for (i = 0; i < partitions; i++) {
            if (i < partitions - 1) {
                this.partition_sz[i] = (data[ptr + 2] << 16)
                        | (data[ptr + 1] << 8) | data[ptr];
                ptr += 3;
            } else
                this.partition_sz[i] = sz;

            if (sz < this.partition_sz[i])
                throw  "Truncated partition";

            sz -= this.partition_sz[i];
        }


        for (i = 0; i < decoder.token_hdr.partitions; i++) {
            //init_bool_decoder(ctx.tokens[i].bool, data, ptr,
            //      ctx.token_hdr.partition_sz[i]);
            decoder.tokens[i].bool.init(data, ptr,
                    decoder.token_hdr.partition_sz[i]);
            ptr += decoder.token_hdr.partition_sz[i];
        }
    }
    
    /**
     * vp8_dixie_tokens_init
     * @param {type} ctx
     * @returns {undefined}
     */
    init() {
        var ctx = this.decoder;
        var partitions = ctx.token_hdr.partitions;

        if (ctx.frame_hdr.frame_size_updated === 1) {
            var i = 0;
            var coeff_row_sz = ctx.mb_cols * 400; //25*16

            for (i = 0; i < partitions; i++) {
                ctx.tokens[i].coeffs = new Uint32Array(coeff_row_sz);
            }

            var mb_cols = ctx.mb_cols;
            ctx.above_token_entropy_ctx = new Array(mb_cols);
            for (var i = 0; i < mb_cols; i++)
                ctx.above_token_entropy_ctx[i] = new Int32Array(9);

        }
    }
    
}

module.exports = TokenHeader;