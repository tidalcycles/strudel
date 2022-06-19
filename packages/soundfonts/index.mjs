import { Pattern } from '@strudel.cycles/core';
import { getAudioContext } from '@strudel.cycles/webaudio';
// import * as WebAudioFontPlayer from 'webaudiofont';
import * as WebAudioFont from 'webaudiofont';
console.log('WebAudioFont:!', WebAudioFont);
// https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js
// https://surikov.github.io/webaudiofontdata/sound/0000_JCLive_sf2_file.js

// https://github.com/surikov/webaudiofont#dynamic-loading
/* function changeInstrument(path, name) {
  player.loader.startLoad(audioContext, path, name);
  player.loader.waitLoad(function () {
    instr = window[name];
  });
} */

Pattern.prototype.soundfont = function (soundfont) {
  const ac = getAudioContext();
  return this.onTrigger((t, hap, ct) => {
    // const url = `https://surikov.github.io/webaudiofontdata/sound/${soundfont}_sf2_file.js`;
    // changeInstrument('https://surikov.github.io/webaudiofontdata/sound/0290_Aspirin_sf2_file.js','_tone_0290_Aspirin_sf2_file');
    console.log('url', url);
    // const player = WebAudioFontPlayer();
    // console.log('soundfont', url, player);
    /* var selectedPreset = _tone_0000_JCLive_sf2_file;
    player.loader.decodeAfterLoading(ac, '_tone_0000_JCLive_sf2_file');
    player.queueWaveTable(ac, ac.destination, selectedPreset, 0, 55, 3.5); */
  });
};
