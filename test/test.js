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