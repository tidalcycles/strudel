import { Pattern } from '@strudel.cycles/core';
import { Csound } from '@csound/browser'; // TODO: use dynamic import for code splitting..
import csd from './sounds.csd?raw';
import { getAudioContext } from '@strudel.cycles/webaudio';

let csoundLoader;

Pattern.prototype.csound = async function () {
  if (!csoundLoader) {
    csoundLoader = (async () => {
      const csound = await Csound({ audioContext: getAudioContext() });
      await csound.setOption('-m0');
      await csound.compileCsdText(csd);
      await csound.setControlChannel('main.note.amp', -12);
      await csound.start();
      return csound;
    })();
  }
  const csound = await csoundLoader;
  return this.onTrigger((time, hap, currentTime) => {
    const { gain = 0.8 } = hap.value;
    const deadline = time - currentTime;
    const midi = toMidi(getPlayableNoteValue(hap));
    // TODO: find out how to send a precise ctx based time
    const ctime = `next_time(.000001)+${deadline.toFixed(6)}`;
    // const ctime = `${deadline.toFixed(6)}`;
    const cmidi = `cpsmidinn(${midi})`;
    const cgain = gain ? `ampdbfs(-32 + 32*${gain})` : `0`;
    const code = `schedule(1, ${ctime}, .125, ${cmidi}, ${cgain})`;
    csound.evalCode(code);
  });
};
