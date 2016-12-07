'use strict';


class QuantizationHeader {
    
    constructor() {
        this.q_index = 0; //uint32
        this.delta_update = 0; //1
        this.y1_dc_delta_q = 0; //2
        this.y2_dc_delta_q = 0; //3
        this.y2_ac_delta_q = 0; // 4
        this.uv_dc_delta_q = 0; //5
        this.uv_ac_delta_q = 0; // 6
    }

    decode(bool) {
        var q_update = 0;
        var last_q = this.q_index;

        this.q_index = bool.get_uint(7);
        q_update = (last_q !== this.q_index) + 0;
        q_update |= (this.y1_dc_delta_q = bool.maybe_get_int(4));
        q_update |= (this.y2_dc_delta_q = bool.maybe_get_int(4));
        q_update |= (this.y2_ac_delta_q = bool.maybe_get_int(4));
        q_update |= (this.uv_dc_delta_q = bool.maybe_get_int(4));
        q_update |= (this.uv_ac_delta_q = bool.maybe_get_int(4));
        this.delta_update = q_update;
    }
}

module.exports = QuantizationHeader;