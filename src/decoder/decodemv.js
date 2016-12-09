'use strict';

/*
 * read_segment_id
 * vp8_reader *r, MB_MODE_INFO *mi, MACROBLOCKD *x
 * passing in segment header for now
 */
function read_mb_features(r, mi, x) {
    // Is segmentation enabled 
    if (x.enabled && x.update_map) {
        
        // If so then read the segment id. 
        if (r.get_prob( x.tree_probs[0]) === 1) {
            mi.base.segment_id = 2 + r.get_prob(x.tree_probs[2]);
        } else {
            mi.base.segment_id = r.get_prob(x.tree_probs[1]);
        }
        
    }
}



module.exports = {};
module.exports.read_mb_features = read_mb_features;