'use strict';
/*
 * 
 * @param {VP8D_COMP} pbi
 * @returns {undefined}
 */
function vp8_decode_frame(pbi){
    
    return 0;
}

/*

  vp8_reader *const bc = &pbi->mbc[8];
  VP8_COMMON *const pc = &pbi->common;
  MACROBLOCKD *const xd = &pbi->mb;
  const unsigned char *data = pbi->fragments.ptrs[0];
  const unsigned int data_sz = pbi->fragments.sizes[0];
  const unsigned char *data_end = data + data_sz;
  ptrdiff_t first_partition_length_in_bytes;

  int i, j, k, l;
  const int *const mb_feature_data_bits = vp8_mb_feature_data_bits;
  int corrupt_tokens = 0;
  int prev_independent_partitions = pbi->independent_partitions;

  YV12_BUFFER_CONFIG *yv12_fb_new = pbi->dec_fb_ref[INTRA_FRAME];

  // start with no corruption of current frame 
  xd->corrupted = 0;
  yv12_fb_new->corrupted = 0;

  if (data_end - data < 3) {
    if (!pbi->ec_active) {
      vpx_internal_error(&pc->error, VPX_CODEC_CORRUPT_FRAME,
                         "Truncated packet");
    }

    // Declare the missing frame as an inter frame since it will
      // be handled as an inter frame when we have estimated its
       //motion vectors. 
    pc->frame_type = INTER_FRAME;
    pc->version = 0;
    pc->show_frame = 1;
    first_partition_length_in_bytes = 0;
  } else {
    unsigned char clear_buffer[10];
    const unsigned char *clear = data;
    if (pbi->decrypt_cb) {
      int n = (int)VPXMIN(sizeof(clear_buffer), data_sz);
      pbi->decrypt_cb(pbi->decrypt_state, data, clear_buffer, n);
      clear = clear_buffer;
    }

    pc->frame_type = (FRAME_TYPE)(clear[0] & 1);
    pc->version = (clear[0] >> 1) & 7;
    pc->show_frame = (clear[0] >> 4) & 1;
    first_partition_length_in_bytes =
        (clear[0] | (clear[1] << 8) | (clear[2] << 16)) >> 5;

    if (!pbi->ec_active && (data + first_partition_length_in_bytes > data_end ||
                            data + first_partition_length_in_bytes < data)) {
      vpx_internal_error(&pc->error, VPX_CODEC_CORRUPT_FRAME,
                         "Truncated packet or corrupt partition 0 length");
    }

    data += 3;
    clear += 3;

    vp8_setup_version(pc);

    if (pc->frame_type == KEY_FRAME) {
      / /vet via sync code 
       //When error concealment is enabled we should only check the sync
        //code if we have enough bits available
       
      if (!pbi->ec_active || data + 3 < data_end) {
        if (clear[0] != 0x9d || clear[1] != 0x01 || clear[2] != 0x2a) {
          vpx_internal_error(&pc->error, VPX_CODEC_UNSUP_BITSTREAM,
                             "Invalid frame sync code");
        }
      }

      // If error concealment is enabled we should only parse the new size
       // if we have enough data. Otherwise we will end up with the wrong
        //size.
       
      if (!pbi->ec_active || data + 6 < data_end) {
        pc->Width = (clear[3] | (clear[4] << 8)) & 0x3fff;
        pc->horiz_scale = clear[4] >> 6;
        pc->Height = (clear[5] | (clear[6] << 8)) & 0x3fff;
        pc->vert_scale = clear[6] >> 6;
      }
      data += 7;
    } else {
      memcpy(&xd->pre, yv12_fb_new, sizeof(YV12_BUFFER_CONFIG));
      memcpy(&xd->dst, yv12_fb_new, sizeof(YV12_BUFFER_CONFIG));
    }
  }
  if ((!pbi->decoded_key_frame && pc->frame_type != KEY_FRAME)) {
    return -1;
  }

  init_frame(pbi);

  if (vp8dx_start_decode(bc, data, (unsigned int)(data_end - data),
                         pbi->decrypt_cb, pbi->decrypt_state)) {
    vpx_internal_error(&pc->error, VPX_CODEC_MEM_ERROR,
                       "Failed to allocate bool decoder 0");
  }
  if (pc->frame_type == KEY_FRAME) {
    (void)vp8_read_bit(bc);  // colorspace
    pc->clamp_type = (CLAMP_TYPE)vp8_read_bit(bc);
  }

  // Is segmentation enabled 
  xd->segmentation_enabled = (unsigned char)vp8_read_bit(bc);

  if (xd->segmentation_enabled) {
    // Signal whether or not the segmentation map is being explicitly updated
    // this frame. 
    xd->update_mb_segmentation_map = (unsigned char)vp8_read_bit(bc);
    xd->update_mb_segmentation_data = (unsigned char)vp8_read_bit(bc);

    if (xd->update_mb_segmentation_data) {
      xd->mb_segement_abs_delta = (unsigned char)vp8_read_bit(bc);

      memset(xd->segment_feature_data, 0, sizeof(xd->segment_feature_data));

      //For each segmentation feature (Quant and loop filter level) 
      for (i = 0; i < MB_LVL_MAX; ++i) {
        for (j = 0; j < MAX_MB_SEGMENTS; ++j) {
          /* Frame level data 
          if (vp8_read_bit(bc)) {
            xd->segment_feature_data[i][j] =
                (signed char)vp8_read_literal(bc, mb_feature_data_bits[i]);

            if (vp8_read_bit(bc)) {
              xd->segment_feature_data[i][j] = -xd->segment_feature_data[i][j];
            }
          } else {
            xd->segment_feature_data[i][j] = 0;
          }
        }
      }
    }

    if (xd->update_mb_segmentation_map) {
      // Which macro block level features are enabled 
      memset(xd->mb_segment_tree_probs, 255, sizeof(xd->mb_segment_tree_probs));

      // Read the probs used to decode the segment id for each macro block. 
      for (i = 0; i < MB_FEATURE_TREE_PROBS; ++i) {
        // If not explicitly set value is defaulted to 255 by memset above 
        if (vp8_read_bit(bc)) {
          xd->mb_segment_tree_probs[i] = (vp8_prob)vp8_read_literal(bc, 8);
        }
      }
    }
  } else {
    // No segmentation updates on this frame 
    xd->update_mb_segmentation_map = 0;
    xd->update_mb_segmentation_data = 0;
  }

  // Read the loop filter level and type 
  pc->filter_type = (LOOPFILTERTYPE)vp8_read_bit(bc);
  pc->filter_level = vp8_read_literal(bc, 6);
  pc->sharpness_level = vp8_read_literal(bc, 3);

  // Read in loop filter deltas applied at the MB level based on mode or ref
   // frame. 
   
  xd->mode_ref_lf_delta_update = 0;
  xd->mode_ref_lf_delta_enabled = (unsigned char)vp8_read_bit(bc);

  if (xd->mode_ref_lf_delta_enabled) {
    /* Do the deltas need to be updated 
    xd->mode_ref_lf_delta_update = (unsigned char)vp8_read_bit(bc);

    if (xd->mode_ref_lf_delta_update) {
      /* Send update 
      for (i = 0; i < MAX_REF_LF_DELTAS; ++i) {
        if (vp8_read_bit(bc)) {
          /*sign = vp8_read_bit( bc );
          xd->ref_lf_deltas[i] = (signed char)vp8_read_literal(bc, 6);

          if (vp8_read_bit(bc)) { 
            xd->ref_lf_deltas[i] = xd->ref_lf_deltas[i] * -1;
          }
        }
      }

      /* Send update */
      for (i = 0; i < MAX_MODE_LF_DELTAS; ++i) {
        if (vp8_read_bit(bc)) {
          /*sign = vp8_read_bit( bc );
          xd->mode_lf_deltas[i] = (signed char)vp8_read_literal(bc, 6);

          if (vp8_read_bit(bc)) { /* Apply sign 
            xd->mode_lf_deltas[i] = xd->mode_lf_deltas[i] * -1;
          }
        }
      }
    }
  }

  setup_token_decoder(pbi, data + first_partition_length_in_bytes);

  xd->current_bc = &pbi->mbc[0];

  /* Read the default quantizers. 
  {
    int Q, q_update;

    Q = vp8_read_literal(bc, 7); /* AC 1st order Q = default */
    pc->base_qindex = Q;
    q_update = 0;
    pc->y1dc_delta_q = get_delta_q(bc, pc->y1dc_delta_q, &q_update);
    pc->y2dc_delta_q = get_delta_q(bc, pc->y2dc_delta_q, &q_update);
    pc->y2ac_delta_q = get_delta_q(bc, pc->y2ac_delta_q, &q_update);
    pc->uvdc_delta_q = get_delta_q(bc, pc->uvdc_delta_q, &q_update);
    pc->uvac_delta_q = get_delta_q(bc, pc->uvac_delta_q, &q_update);

    if (q_update) vp8cx_init_de_quantizer(pbi);

    /* MB level dequantizer setup 
    vp8_mb_init_dequantizer(pbi, &pbi->mb);
  }

  /* Determine if the golden frame or ARF buffer should be updated and how.
   * For all non key frames the GF and ARF refresh flags and sign bias
   * flags must be set explicitly.
   
  if (pc->frame_type != KEY_FRAME) {
    /* Should the GF or ARF be updated from the current frame 
    pc->refresh_golden_frame = vp8_read_bit(bc);


    pc->refresh_alt_ref_frame = vp8_read_bit(bc);


    /* Buffer to buffer copy flags. 
    pc->copy_buffer_to_gf = 0;

    if (!pc->refresh_golden_frame) {
      pc->copy_buffer_to_gf = vp8_read_literal(bc, 2);
    }



    pc->copy_buffer_to_arf = 0;

    if (!pc->refresh_alt_ref_frame) {
      pc->copy_buffer_to_arf = vp8_read_literal(bc, 2);
    }


    pc->ref_frame_sign_bias[GOLDEN_FRAME] = vp8_read_bit(bc);
    pc->ref_frame_sign_bias[ALTREF_FRAME] = vp8_read_bit(bc);
  }

  pc->refresh_entropy_probs = vp8_read_bit(bc);


  if (pc->refresh_entropy_probs == 0) {
    memcpy(&pc->lfc, &pc->fc, sizeof(pc->fc));
  }

  pc->refresh_last_frame = pc->frame_type == KEY_FRAME || vp8_read_bit(bc);



  if (0) {
    FILE *z = fopen("decodestats.stt", "a");
    fprintf(z, "%6d F:%d,G:%d,A:%d,L:%d,Q:%d\n", pc->current_video_frame,
            pc->frame_type, pc->refresh_golden_frame, pc->refresh_alt_ref_frame,
            pc->refresh_last_frame, pc->base_qindex);
    fclose(z);
  }

  {
    pbi->independent_partitions = 1;

    /* read coef probability tree 
    for (i = 0; i < BLOCK_TYPES; ++i) {
      for (j = 0; j < COEF_BANDS; ++j) {
        for (k = 0; k < PREV_COEF_CONTEXTS; ++k) {
          for (l = 0; l < ENTROPY_NODES; ++l) {
            vp8_prob *const p = pc->fc.coef_probs[i][j][k] + l;

            if (vp8_read(bc, vp8_coef_update_probs[i][j][k][l])) {
              *p = (vp8_prob)vp8_read_literal(bc, 8);
            }
            if (k > 0 && *p != pc->fc.coef_probs[i][j][k - 1][l]) {
              pbi->independent_partitions = 0;
            }
          }
        }
      }
    }
  }

  /* clear out the coeff buffer 
  memset(xd->qcoeff, 0, sizeof(xd->qcoeff));

  vp8_decode_mode_mvs(pbi);



  memset(pc->above_context, 0, sizeof(ENTROPY_CONTEXT_PLANES) * pc->mb_cols);
  pbi->frame_corrupt_residual = 0;


  {
    decode_mb_rows(pbi);
    corrupt_tokens |= xd->corrupted;
  }

  /* Collect information about decoder corruption. 
  /* 1. Check first boolean decoder for errors. 
  yv12_fb_new->corrupted = vp8dx_bool_error(bc);
  /* 2. Check the macroblock information 
  yv12_fb_new->corrupted |= corrupt_tokens;

  if (!pbi->decoded_key_frame) {
    if (pc->frame_type == KEY_FRAME && !yv12_fb_new->corrupted) {
      pbi->decoded_key_frame = 1;
    } else {
      vpx_internal_error(&pbi->common.error, VPX_CODEC_CORRUPT_FRAME,
                         "A stream must start with a complete key frame");
    }
  }



  if (pc->refresh_entropy_probs == 0) {
    memcpy(&pc->fc, &pc->lfc, sizeof(pc->fc));
    pbi->independent_partitions = prev_independent_partitions;
  }




*/