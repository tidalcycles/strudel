import { parseNumeral, Pattern, getEventOffsetMs } from '@strudel/core';
import { Invoke } from './utils.mjs';

let offsetTime;
let weight = 1;
let timeAtPrevOffsetSample;
let rollingOffsetTime;


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
    // console.log(time, currentTime)
  
    const unixTimeSecs = Date.now() / 1000;
    const newOffsetTime = unixTimeSecs - currentTime;

    if (unixTimeSecs - timeAtPrevOffsetSample > 2) {
      timeAtPrevOffsetSample = unixTimeSecs;
      rollingOffsetTime = newOffsetTime;
    }


    //account for the js clock freezing or resetting for some reason
    if (offsetTime == null  || Math.abs(rollingOffsetTime - offsetTime) > .1
    ) {
     offsetTime = newOffsetTime;
    }
    // prevTime = currentTime;
    const timestamp = offsetTime + targetTime
    // const timestamp =  unixTimeSecs + (targetTime - currentTime)
    
   console.log(offsetTime)
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
    // const messagesfromjs = [];
    // if (params.length) {
    //   messagesfromjs.push({ target: '/dirt/play', timestamp, params });
    // }

    // if (messagesfromjs.length) {
    //   setTimeout(() => {
    //     Invoke('sendosc', { messagesfromjs });
    //   });
    // }
  });
};
