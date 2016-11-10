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


for(var file in testData){
    console.log(file);
}

var data;



describe('Running Test Vectors', function () {
    for (var file in testData) {
        var frameData = testData[file];
        var sz;

        describe('Loading Vector : ' + file, function () {
            data = fs.readFileSync(vectorPath + file);
            ivf.receiveBuffer(data);
            ivf.parseHeader();


            for (var i = 0; i < frameData.length; i++) {
                var valid = frameData[i];
                var data = new Uint8Array(ivf.processFrame()); //frame data
                var sz = data.byteLength;
                var res;
                decoder.saved_entropy_valid = 0;


                it('Parse frame header ' + i, function () {
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

                });
            }

        });
    }


});
