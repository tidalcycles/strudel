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
      const { started, cps, phase, timestamp } = payload;

      // TODO: I'm not sure how to hook this up this cps adjustment in Strudel
      // (if cps !== clock_cps) {
      //    updateClock(cps)
      // }

      // TODO: I'm not sure how to hook this up this phase adjustment in Strudel
      // a phase adjustment message is sent every 30 seconds from backend to keep clocks in sync
      //   if (Math.abs(phase - this.clock.getPhase()) > someDelta) {
      //     setCyclistPhase(phase)
      //   }

      if (this.started !== started && started != null) {
        if (started) {
          // the time delay in ms that seems to occur when starting the clock. Unsure if this is standard across all clients
          const evaluationTime = 140;

          // when start message comes from abelink, delay starting cyclist clock until the start of the next abelink phase
          this.start_timer = window.setTimeout(() => {
            // TODO: evaluate the code so if another source triggers the play there will not be an error

            logger('[cyclist] start');
            this.clock.start();
            this.setStarted(true);
          }, timestamp - Date.now() - evaluationTime);
        } else {
          this.stop();
        }
      }
    });
  }

  start() {
    if (!this.pattern) {
      throw new Error('Scheduler: no pattern set! call .setPattern first.');
    }
    let x = Date.now();
    const linkmsg = {
      // TODO: change this to value of "main" clock cps
      cps: 0,
      started: true,
      timestamp: Date.now(),
      phase: this.clock.getPhase(),
    };
    Invoke('sendabelinkmsg', { linkmsg });
  }

  stop() {
    logger('[cyclist] stop');
    this.clock.stop();
    this.lastEnd = 0;
    this.setStarted(false);
    const linkmsg = {
      // TODO: change this to value of "main" clock cps
      cps: 0,
      started: false,
      timestamp: Date.now(),
      phase: this.clock.getPhase(),
    };
    Invoke('sendabelinkmsg', { linkmsg });
  }
}
