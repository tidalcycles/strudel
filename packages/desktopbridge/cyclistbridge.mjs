import { Cyclist } from '@strudel.cycles/core';
import { logger } from '../core/logger.mjs';
import { Invoke } from '../../website/src/tauri.mjs';
import { listen } from '@tauri-apps/api/event';

export class CyclistBridge extends Cyclist {
  constructor(params) {
    super(params);

    this.start_timer;
    this.abeLinkListener = listen('abelink-event', async (e) => {
      const payload = e?.payload;
      if (payload == null) {
        return;
      }
      const { started, cps, timestamp } = payload;
      // (if bpm !== prev_bpm) {
      //update the clock
      // }
      if (this.started !== started && started != null) {
        if (started) {
          this.start_timer = window.setTimeout(() => {
            logger('[cyclist] start');
            this.clock.start();
            this.setStarted(true);
          }, timestamp - Date.now());
        } else {
          this.stop();
        }
      }

      const { message, message_type } = e.payload;
    });
  }

  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }

    const linkmsg = {
      cps: 0.5,
      started: true,
      timestamp: Date.now(),
    };
    Invoke('sendabelinkmsg', { linkmsg });
  }

  stop() {
    logger('[cyclist] stop');
    this.clock.stop();
    this.lastEnd = 0;
    this.setStarted(false);
    const linkmsg = {
      cps: 0.5,
      started: false,
      timestamp: Date.now(),
    };
    Invoke('sendabelinkmsg', { linkmsg });
  }
}
