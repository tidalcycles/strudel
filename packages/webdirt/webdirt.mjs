import * as strudel from '@strudel.cycles/core';
const { Pattern } = strudel;
import * as WebDirt from 'WebDirt';

let webDirt;

/*
example config:
{
    sampleMapUrl: 'EmuSP12.json',
    sampleFolder: 'EmuSP12',
}
*/
export function loadWebDirt(config) {
  webDirt = new WebDirt.WebDirt(config);
  webDirt.initializeWebAudio();
}

Pattern.prototype.webdirt = function () {
  // create a WebDirt object and initialize Web Audio context
  return this._withHap((hap) => {
    const onTrigger = (time, e, currentTime) => {
      if (!webDirt) {
        throw new Error('WebDirt not initialized!');
      }
      const deadline = time - currentTime;
      const { s, n = 0 } = e.value;
      webDirt.playSample({ s, n }, deadline);
    };
    return hap.setContext({ ...hap.context, onTrigger });
  });
};
