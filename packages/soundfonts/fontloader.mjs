import { noteToMidi, freqToMidi, getSoundIndex } from '@strudel/core';
import {
  getAudioContext,
  registerSound,
  getParamADSR,
  getADSRValues,
  getPitchEnvelope,
  getVibratoOscillator,
} from '@strudel/webaudio';
import gm from './gm.mjs';

let defaultSoundfontUrl = 'https://felixroos.github.io/webaudiofontdata/sound';
let soundfontUrl = defaultSoundfontUrl;

export function setSoundfontUrl(value) {
  soundfontUrl = value;
}

let loadCache = {};
async function loadFont(name) {
  if (loadCache[name]) {
    return loadCache[name];
  }
  const load = async () => {
    // TODO: make soundfont source configurable
    const url = `${soundfontUrl}/${name}.js`;
    const preset = await fetch(url).then((res) => res.text());
    let [_, data] = preset.split('={');
    return eval('{' + data);
  };
  loadCache[name] = load();
  return loadCache[name];
}

export async function getFontBufferSource(name, value, ac) {
  let { note = 'c3', freq } = value;
  let midi;
  if (freq) {
    midi = freqToMidi(freq);
  } else if (typeof note === 'string') {
    midi = noteToMidi(note);
  } else if (typeof note === 'number') {
    midi = note;
  } else {
    throw new Error(`unexpected "note" type "${typeof note}"`);
  }

  const { buffer, zone } = await getFontPitch(name, midi, ac);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
  const playbackRate = 1.0 * Math.pow(2, (100.0 * midi - baseDetune) / 1200.0);
  // src detune?
  src.playbackRate.value = playbackRate;
  const loop = zone.loopStart > 1 && zone.loopStart < zone.loopEnd;
  if (!loop) {
    /* const waveDuration = duration + this.afterTime;
          if (waveDuration > zone.buffer.duration / playbackRate) {
            waveDuration = zone.buffer.duration / playbackRate;
            // TODO: do sth with waveduration
          } */
  } else {
    src.loop = true;
    src.loopStart = zone.loopStart / zone.sampleRate;
    src.loopEnd = zone.loopEnd / zone.sampleRate;
    //+ (zone.delay ? zone.delay : 0);
  }
  return src;
}

let bufferCache = {};
export async function getFontPitch(name, pitch, ac) {
  const key = `${name}:::${pitch}`;
  if (bufferCache[key]) {
    return bufferCache[key];
  }
  // console.log('load buffer', key);
  const load = async () => {
    const preset = await loadFont(name);
    if (!preset) {
      throw new Error(`Could not load soundfont ${name}`);
    }
    const zone = findZone(preset, pitch);
    if (!zone) {
      throw new Error('no soundfont zone found for preset ', name, 'pitch', pitch);
    }
    const buffer = await getBuffer(zone, ac);
    if (!buffer) {
      throw new Error(`no soundfont buffer found for preset ${name}, pitch: ${pitch}`);
    }
    return { buffer, zone };
  };
  bufferCache[key] = load(); // dont await here to cache promise immediately!
  return bufferCache[key];
}

function findZone(preset, pitch) {
  return preset.find((zone) => {
    return zone.keyRangeLow <= pitch && zone.keyRangeHigh + 1 >= pitch;
  });
}

// promisified version of https://github.com/felixroos/webaudiofont/blob/c6f97249b60dcfafc20fca5bb381294a6b2f8f51/npm/dist/WebAudioFontPlayer.js#L740
async function getBuffer(zone, audioContext) {
  if (zone.sample) {
    console.warn('zone.sample untested!');
    const decoded = atob(zone.sample);
    zone.buffer = audioContext.createBuffer(1, decoded.length / 2, zone.sampleRate);
    const float32Array = zone.buffer.getChannelData(0);
    let b1, b2, n;
    for (var i = 0; i < decoded.length / 2; i++) {
      b1 = decoded.charCodeAt(i * 2);
      b2 = decoded.charCodeAt(i * 2 + 1);
      if (b1 < 0) {
        b1 = 256 + b1;
      }
      if (b2 < 0) {
        b2 = 256 + b2;
      }
      n = b2 * 256 + b1;
      if (n >= 65536 / 2) {
        n = n - 65536;
      }
      float32Array[i] = n / 65536.0;
    }
  } else {
    if (zone.file) {
      const datalen = zone.file.length;
      const arraybuffer = new ArrayBuffer(datalen);
      const view = new Uint8Array(arraybuffer);
      const decoded = atob(zone.file);
      let b;
      for (let i = 0; i < decoded.length; i++) {
        b = decoded.charCodeAt(i);
        view[i] = b;
      }
      return new Promise((resolve) => audioContext.decodeAudioData(arraybuffer, resolve));
    }
  }
}

export function registerSoundfonts() {
  Object.entries(gm).forEach(([name, fonts]) => {
    registerSound(
      name,
      async (time, value, onended) => {
        const [attack, decay, sustain, release] = getADSRValues([
          value.attack,
          value.decay,
          value.sustain,
          value.release,
        ]);

        const { duration } = value;
        const n = getSoundIndex(value.n, fonts.length);
        const font = fonts[n];
        const ctx = getAudioContext();
        const bufferSource = await getFontBufferSource(font, value, ctx);
        bufferSource.start(time);
        const envGain = ctx.createGain();
        const node = bufferSource.connect(envGain);
        const holdEnd = time + duration;
        getParamADSR(node.gain, attack, decay, sustain, release, 0, 0.3, time, holdEnd, 'linear');
        let envEnd = holdEnd + release + 0.01;

        // vibrato
        let vibratoOscillator = getVibratoOscillator(bufferSource.detune, value, time);
        // pitch envelope
        getPitchEnvelope(bufferSource.detune, value, time, holdEnd);

        bufferSource.stop(envEnd);
        const stop = (releaseTime) => {};
        bufferSource.onended = () => {
          bufferSource.disconnect();
          vibratoOscillator?.stop();
          node.disconnect();
          onended();
        };
        return { node, stop };
      },
      { type: 'soundfont', prebake: true, fonts },
    );
  });
}
