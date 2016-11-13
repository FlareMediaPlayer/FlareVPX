//Unit Tests
"use strict"; 
var assert = require('assert');
var vp8 = require('../src/vp8.js');
var ivf = require('flare-ivf');
var fs = require('fs');


var decoder = new vp8();
var ivf = new ivf();
var vectorPath = 'vp8-test-vectors/';
var testData = require('./test-data.json');

/*
for(var file in testData){
    console.log(file);
}
*/

var FRAME_HEADER_SZ = 3;
var KEYFRAME_HEADER_SZ = 7;
var MAX_PARTITIONS = 8;
var data;

function decode_frame(i, valid) {
    it('decode frame : ' + i, function () {

        var data = new Uint8Array(ivf.processFrame()); //frame data
        var sz = data.byteLength;
        var res;
        decoder.saved_entropy_valid = 0;
        if ((res = decoder.frame_hdr.parse(data, sz)))
            throw "Failed to parse frame header";
        
        
        assert.equal(decoder.frame_hdr.is_keyframe, valid.is_keyframe);
        assert.equal(decoder.frame_hdr.version, valid.version);
        assert.equal(decoder.frame_hdr.is_shown, valid.is_shown);

        if (valid.is_keyframe) {
            assert.equal(decoder.frame_hdr.kf.w, valid.w);
            assert.equal(decoder.frame_hdr.kf.h, valid.h);
            assert.equal(decoder.frame_hdr.kf.scale_w, valid.scale_w);
            assert.equal(decoder.frame_hdr.kf.scale_h, valid.scale_h);
        }

        //now calculate how many macroblock rows and columns
        data.ptr += FRAME_HEADER_SZ;
        sz -= FRAME_HEADER_SZ;

        if (decoder.frame_hdr.is_keyframe === true) {
            data.ptr += KEYFRAME_HEADER_SZ;
            sz -= KEYFRAME_HEADER_SZ;
            decoder.mb_cols = ((decoder.frame_hdr.kf.w + 15) / 16) | 0;
            decoder.mb_rows = ((decoder.frame_hdr.kf.h + 15) / 16) | 0;

            assert.equal(decoder.mb_cols, valid.mb_cols);
            assert.equal(decoder.mb_rows, valid.mb_rows);
        }
        
        decoder.boolDecoder.init(data, data.ptr, decoder.frame_hdr.part0_sz);


        /* Skip the colorspace and clamping bits */
        if (decoder.frame_hdr.is_keyframe){
            decoder.boolDecoder.get_uint(2);//skip bits for now
        
        }
       

        decoder.segment_hdr.decode(decoder.boolDecoder);
        assert.equal(decoder.segment_hdr.enabled, valid.enabled);
        assert.equal(decoder.segment_hdr.update_data, valid.update_data);
        assert.equal(decoder.segment_hdr.update_map, valid.update_map);
        assert.equal(decoder.segment_hdr.abs, valid.abs);
        assert.equal(decoder.segment_hdr.tree_probs[0], valid["tree_probs[0]"]);
        assert.equal(decoder.segment_hdr.tree_probs[1], valid["tree_probs[1]"]);
        assert.equal(decoder.segment_hdr.tree_probs[2], valid["tree_probs[2]"]);
        
        assert.equal(decoder.segment_hdr.lf_level[0], valid["lf_level[0]"]);
        assert.equal(decoder.segment_hdr.lf_level[1], valid["lf_level[1]"]);
        assert.equal(decoder.segment_hdr.lf_level[2], valid["lf_level[2]"]);
        assert.equal(decoder.segment_hdr.lf_level[3], valid["lf_level[3]"]);
        
        assert.equal(decoder.segment_hdr.quant_idx[0], valid["quant_idx[0]"]);
        assert.equal(decoder.segment_hdr.quant_idx[1], valid["quant_idx[1]"]);
        assert.equal(decoder.segment_hdr.quant_idx[2], valid["quant_idx[2]"]);
        assert.equal(decoder.segment_hdr.quant_idx[3], valid["quant_idx[3]"]);
        
        assert.equal(decoder.segment_hdr.tree_probs[0], valid["tree_probs[0]"]);
        assert.equal(decoder.segment_hdr.tree_probs[1], valid["tree_probs[1]"]);
        assert.equal(decoder.segment_hdr.tree_probs[2], valid["tree_probs[2]"]);
        
        decoder.loopfilter_hdr.decode(decoder.boolDecoder);
        assert.equal(decoder.loopfilter_hdr.use_simple, valid.use_simple);
        assert.equal(decoder.loopfilter_hdr.level, valid.level);
        assert.equal(decoder.loopfilter_hdr.sharpness, valid.sharpness);
        assert.equal(decoder.loopfilter_hdr.delta_enabled, valid.delta_enabled);
        
        assert.equal(decoder.loopfilter_hdr.ref_delta[0], valid["ref_delta[0]"]);
        assert.equal(decoder.loopfilter_hdr.ref_delta[1], valid["ref_delta[1]"]);
        assert.equal(decoder.loopfilter_hdr.ref_delta[2], valid["ref_delta[2]"]);
        assert.equal(decoder.loopfilter_hdr.ref_delta[3], valid["ref_delta[3]"]);
        
        assert.equal(decoder.loopfilter_hdr.mode_delta[0], valid["mode_delta[0]"]);
        assert.equal(decoder.loopfilter_hdr.mode_delta[1], valid["mode_delta[1]"]);
        assert.equal(decoder.loopfilter_hdr.mode_delta[2], valid["mode_delta[2]"]);
        assert.equal(decoder.loopfilter_hdr.mode_delta[3], valid["mode_delta[3]"]);
        
        decoder.token_hdr.decode(data, data.ptr + decoder.frame_hdr.part0_sz,
                sz - decoder.frame_hdr.part0_sz);

        assert.equal(decoder.token_hdr.partition_sz[0], valid["partition_sz[0]"]);
        assert.equal(decoder.token_hdr.partition_sz[1], valid["partition_sz[1]"]);
        assert.equal(decoder.token_hdr.partition_sz[2], valid["partition_sz[2]"]);
        assert.equal(decoder.token_hdr.partition_sz[3], valid["partition_sz[3]"]);
        assert.equal(decoder.token_hdr.partition_sz[4], valid["partition_sz[4]"]);
        assert.equal(decoder.token_hdr.partition_sz[5], valid["partition_sz[5]"]);
        assert.equal(decoder.token_hdr.partition_sz[6], valid["partition_sz[6]"]);
        assert.equal(decoder.token_hdr.partition_sz[7], valid["partition_sz[7]"]);
        
        decoder.quant_hdr.decode(decoder.boolDecoder);
        assert.equal(decoder.quant_hdr.q_index, valid.q_index);
        assert.equal(decoder.quant_hdr.delta_update, valid.delta_update);
        assert.equal(decoder.quant_hdr.y1_dc_delta_q, valid.y1_dc_delta_q);
        assert.equal(decoder.quant_hdr.y2_dc_delta_q, valid.y2_dc_delta_q);
        assert.equal(decoder.quant_hdr.y2_ac_delta_q, valid.y2_ac_delta_q);
        assert.equal(decoder.quant_hdr.uv_dc_delta_q, valid.uv_dc_delta_q);
        assert.equal(decoder.quant_hdr.uv_ac_delta_q, valid.uv_ac_delta_q);
        
        //Reference Header
        decoder.reference_hdr.decode(decoder.boolDecoder);
        assert.equal(decoder.reference_hdr.refresh_last, valid.refresh_last);
        assert.equal(decoder.reference_hdr.refresh_gf, valid.refresh_gf);
        assert.equal(decoder.reference_hdr.refresh_arf, valid.refresh_arf);
        assert.equal(decoder.reference_hdr.copy_gf, valid.copy_gf);
        assert.equal(decoder.reference_hdr.copy_arf, valid.copy_arf);
        assert.equal(decoder.reference_hdr.sign_bias[0], valid["sign_bias[0]"]);
        assert.equal(decoder.reference_hdr.sign_bias[1], valid["sign_bias[1]"]);
        assert.equal(decoder.reference_hdr.sign_bias[2], valid["sign_bias[2]"]);
        assert.equal(decoder.reference_hdr.sign_bias[3], valid["sign_bias[3]"]);
        assert.equal(decoder.reference_hdr.refresh_entropy, valid.refresh_entropy);
        

        if (decoder.frame_hdr.is_keyframe === true)
            // Load coefficient probability updates
            decoder.entropy_hdr.loadDefaultProbs();

        if (decoder.reference_hdr.refresh_entropy === 0) {
            //this should probably be a deep copy
            decoder.saved_entropy = decoder.entropy_hdr;
            decoder.saved_entropy_valid = 1;
        }
        
        assert.equal(decoder.saved_entropy_valid, valid.saved_entropy_valid);
        
     

    });
}

describe('Running Test Vectors', function () {
    for (var file in testData) {
        var frameData = testData[file];
        var sz;

        describe('Testing vector Vector : ' + file, function () {
            data = fs.readFileSync(vectorPath + file);
            ivf.receiveBuffer(data);
            ivf.parseHeader();

            for (var i = 0; i < frameData.length; i++) {                
                decode_frame(i , frameData[i]);   
            }
        });
    }
});