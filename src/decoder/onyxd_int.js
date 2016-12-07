
//include "vp8/common/onyxd.h"
//include "vp8/common/onyxc_int.h"


/*
 typedef struct {
 int ithread;
 void *ptr1;
 void *ptr2;
 } DECODETHREAD_DATA;
 */

//typedef struct { MACROBLOCKD mbd; } MB_ROW_DEC;
/*
 typedef struct {
 int enabled;
 unsigned int count;
 const unsigned char *ptrs[MAX_PARTITIONS];
 unsigned int sizes[MAX_PARTITIONS];
 } FRAGMENT_DATA;
 */

var MAX_FB_MT_DEC = 32;

/*
 struct frame_buffers {
 
 struct VP8D_COMP *pbi[MAX_FB_MT_DEC];
 };
 */

class VP8D_COMP {

    constructor() {
        //DECLARE_ALIGNED(16, MACROBLOCKD, mb);

        //YV12_BUFFER_CONFIG *dec_fb_ref[NUM_YV12_BUFFERS];

        //DECLARE_ALIGNED(16, VP8_COMMON, common);

        /* the last partition will be used for the modes/mvs */
        //vp8_reader mbc[MAX_PARTITIONS];

        this.oxcf = 0;//VP8D_CONFIG

        this.fragments; //FRAGMENT_DATA ;


        this.last_time_stamp;
        this.ready_for_new_data;

        this.prob_intra = 0;
        this.prob_last = 0;
        this.prob_gf = 0;
        this.prob_skip_false = 0;



        this.decoded_key_frame = 0;
        this.independent_partitions = 0;
        this.frame_corrupt_residual = 0;

        //decrypt_cb;//vpx_decrypt_cb
        this.decrypt_state;
    }
}



