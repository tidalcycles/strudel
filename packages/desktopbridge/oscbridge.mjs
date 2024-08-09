import { parseNumeral, Pattern, getEventOffsetMs } from '@strudel/core';
import { Invoke } from './utils.mjs';

let offsetTime;
let timeAtPrevOffsetSample;
let rollingOffsetTime;
let prevOffsetTimes = []
const averageArray = arr => arr.reduce((a, b) => a + b) / arr.length;

// let prevTime = 0;
Pattern.prototype.osc = function () {
  return this.onTrigger(async (time, hap, currentTime, cps = 1, targetTime) => {
    hap.ensureObjectValue();
    const cycle = hap.wholeOrPart().begin.valueOf();
    const delta = hap.duration.valueOf();
    const controls = Object.assign({}, { cps, cycle, delta }, hap.value);
    // make sure n and note are numbers
    controls.n && (controls.n = parseNumeral(controls.n));
    controls.note && (controls.note = parseNumeral(controls.note));

    const params = [];


    const unixTimeSecs = Date.now() / 1000;
    const newOffsetTime = unixTimeSecs - currentTime;
    prevOffsetTimes.push(newOffsetTime)
    if (prevOffsetTimes.length > 8) {
      prevOffsetTimes.shift()
    }
    // every two seconds, the average of the previous 8 offset times is calculated
    if ( unixTimeSecs - timeAtPrevOffsetSample > 2 || rollingOffsetTime == null) {
      timeAtPrevOffsetSample = unixTimeSecs
      rollingOffsetTime = averageArray(prevOffsetTimes);
    }

    //account for the js clock freezing or resets set the new offset
    if (offsetTime == null  || Math.abs(rollingOffsetTime - offsetTime) > .1
    ) {
     offsetTime = rollingOffsetTime;
    }
    const timestamp = offsetTime + targetTime
    
    Object.keys(controls).forEach((key) => {
      const val = controls[key];
      const value = typeof val === 'number' ? val.toString() : val;

      if (value == null) {
        return;
      }
      params.push({
        name: key,
        value,
        valueisnumber: typeof val === 'number',
      });
    });

  
    if (params.length === 0) {
      return
    }
    const message = { target: '/dirt/play', timestamp, params };
    setTimeout(() => {
      Invoke('sendosc', { messagesfromjs: [message] });
    });

  });
};
