//Unit Tests
"use strict"; 
var assert = require('assert');
var vp8 = require('../src/vp8.js');
var ivf = require('flare-ivf');
var fs = require('fs');


var decoder = new vp8();
var ivf = new ivf();
var vectorPath = 'vp8-test-vectors/';
var data;

describe('Load', function () {    

    describe('Loaded Vp8 Decoder', function () {
        it('Should Initialize decoder', function () {
            data = fs.readFileSync(vectorPath + 'vp80-00-comprehensive-001.ivf');
            ivf.receiveBuffer(data);
            ivf.parseHeader();

            assert.ok(decoder);
            assert.ok(ivf);
        });
    });
    
});

describe('Process', function () {    
    var sz;
    describe('Vector 1', function () {
        
        it('Parse frame 1 header', function () {
            var data = new Uint8Array(ivf.processFrame()); //frame #1
            var sz = data.byteLength;
            var res;
            decoder.saved_entropy_valid = 0;

            if ((res = decoder.frame_hdr.parse(data, sz)))
                throw "Failed to parse frame header";

            assert.equal(decoder.frame_hdr.is_keyframe, true);
            //assert.equal(decoder.frame_hdr.is_experimental, 0);
            assert.equal(decoder.frame_hdr.version, 0);
            assert.equal(decoder.frame_hdr.is_shown, 1);
            assert.equal(decoder.frame_hdr.kf.w, 176);
            assert.equal(decoder.frame_hdr.kf.h, 144);
            assert.equal(decoder.frame_hdr.kf.scale_w, 0);
            assert.equal(decoder.frame_hdr.kf.scale_h, 0);
        });
        
        it('Parse frame 2 header', function () {
            var data = new Uint8Array(ivf.processFrame()); //frame #1
            var sz = data.byteLength;
            var res;
            decoder.saved_entropy_valid = 0;

            if ((res = decoder.frame_hdr.parse(data, sz)))
                throw "Failed to parse frame header";

            assert.equal(decoder.frame_hdr.is_keyframe, false);
            //assert.equal(decoder.frame_hdr.is_experimental, 0);
            assert.equal(decoder.frame_hdr.version, 0);
            assert.equal(decoder.frame_hdr.is_shown, 1);

        });
        
        
        
    });
    
});

