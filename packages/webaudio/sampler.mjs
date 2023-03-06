import { logger, toMidi, valueToMidi } from '@strudel.cycles/core';
import { getAudioContext, setSound } from './index.mjs';
import { getADSR } from './helpers.mjs';

const bufferCache = {}; // string: Promise<ArrayBuffer>
const loadCache = {}; // string: Promise<ArrayBuffer>

export const getCachedBuffer = (url) => bufferCache[url];

function humanFileSize(bytes, si) {
  var thresh = si ? 1000 : 1024;
  if (bytes < thresh) return bytes + ' B';
  var units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  var u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (bytes >= thresh);
  return bytes.toFixed(1) + ' ' + units[u];
}

export const getSampleBufferSource = async (s, n, note, speed, freq, bank) => {
  let transpose = 0;
  if (freq !== undefined && note !== undefined) {
    logger('[sampler] hap has note and freq. ignoring note', 'warning');
  }
  let midi = valueToMidi({ freq, note }, 36);
  transpose = midi - 36; // C3 is middle C

  const ac = getAudioContext();
  let sampleUrl;
  if (Array.isArray(bank)) {
    sampleUrl = bank[n % bank.length];
  } else {
    const midiDiff = (noteA) => toMidi(noteA) - midi;
    // object format will expect keys as notes
    const closest = Object.keys(bank)
      .filter((k) => !k.startsWith('_'))
      .reduce(
        (closest, key, j) => (!closest || Math.abs(midiDiff(key)) < Math.abs(midiDiff(closest)) ? key : closest),
        null,
      );
    transpose = -midiDiff(closest); // semitones to repitch
    sampleUrl = bank[closest][n % bank[closest].length];
  }
  let buffer = await loadBuffer(sampleUrl, ac, s, n);
  if (speed < 0) {
    // should this be cached?
    buffer = reverseBuffer(buffer);
  }
  const bufferSource = ac.createBufferSource();
  bufferSource.buffer = buffer;
  const playbackRate = 1.0 * Math.pow(2, transpose / 12);
  // bufferSource.playbackRate.value = Math.pow(2, transpose / 12);
  bufferSource.playbackRate.value = playbackRate;
  return bufferSource;
};

export const loadBuffer = (url, ac, s, n = 0) => {
  const label = s ? `sound "${s}:${n}"` : 'sample';
  if (!loadCache[url]) {
    logger(`[sampler] load ${label}..`, 'load-sample', { url });
    const timestamp = Date.now();
    loadCache[url] = fetch(url)
      .then((res) => res.arrayBuffer())
      .then(async (res) => {
        const took = Date.now() - timestamp;
        const size = humanFileSize(res.byteLength);
        // const downSpeed = humanFileSize(res.byteLength / took);
        logger(`[sampler] load ${label}... done! loaded ${size} in ${took}ms`, 'loaded-sample', { url });
        const decoded = await ac.decodeAudioData(res);
        bufferCache[url] = decoded;
        return decoded;
      });
  }
  return loadCache[url];
};

export function reverseBuffer(buffer) {
  const ac = getAudioContext();
  const reversed = ac.createBuffer(buffer.numberOfChannels, buffer.length, ac.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    reversed.copyToChannel(buffer.getChannelData(channel).slice().reverse(), channel, channel);
  }
  return reversed;
}

export const getLoadedBuffer = (url) => {
  return bufferCache[url];
};

/**
 * Loads a collection of samples to use with `s`
 * @example
 * samples('github:tidalcycles/Dirt-Samples/master');
 * s("[bd ~]*2, [~ hh]*2, ~ sd")
 * @example
 * samples({
 *  bd: '808bd/BD0000.WAV',
 *  sd: '808sd/SD0010.WAV'
 *  }, 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/');
 * s("[bd ~]*2, [~ hh]*2, ~ sd")
 *
 */

export const samples = async (sampleMap, baseUrl = sampleMap._base || '') => {
  if (typeof sampleMap === 'string') {
    if (sampleMap.startsWith('github:')) {
      let [_, path] = sampleMap.split('github:');
      path = path.endsWith('/') ? path.slice(0, -1) : path;
      sampleMap = `https://raw.githubusercontent.com/${path}/strudel.json`;
    }
    if (typeof fetch !== 'function') {
      // not a browser
      return;
    }
    const base = sampleMap.split('/').slice(0, -1).join('/');
    if (typeof fetch === 'undefined') {
      // skip fetch when in node / testing
      return;
    }
    return fetch(sampleMap)
      .then((res) => res.json())
      .then((json) => samples(json, baseUrl || json._base || base))
      .catch((error) => {
        console.error(error);
        throw new Error(`error loading "${sampleMap}"`);
      });
  }
  Object.entries(sampleMap).forEach(([key, value]) => {
    if (typeof value === 'string') {
      value = [value];
    }
    if (typeof value !== 'object') {
      throw new Error('wrong sample map format for ' + key);
    }
    baseUrl = value._base || baseUrl;
    const replaceUrl = (v) => (baseUrl + v).replace('github:', 'https://raw.githubusercontent.com/');
    if (Array.isArray(value)) {
      //return [key, value.map(replaceUrl)];
      value = value.map(replaceUrl);
    } else {
      // must be object
      value = Object.fromEntries(
        Object.entries(value).map(([note, samples]) => {
          return [note, (typeof samples === 'string' ? [samples] : samples).map(replaceUrl)];
        }),
      );
    }
    setSound(key, (options) => onTriggerSample(options, value));
  });
};

const cutGroups = [];

export async function onTriggerSample(options, bank) {
  const { hap, duration: hapDuration, t, cps } = options;
  const {
    s,
    freq,
    unit,
    nudge = 0, // TODO: is this in seconds?
    cut,
    loop,
    clip = 0, // if 1, samples will be cut off when the hap ends
    n = 0,
    note,
    speed = 1, // sample playback speed
    begin = 0,
    end = 1,
  } = hap.value;
  const ac = getAudioContext();
  // destructure adsr here, because the default should be different for synths and samples
  const { attack = 0.001, decay = 0.001, sustain = 1, release = 0.001 } = hap.value;
  // load sample
  if (speed === 0) {
    // no playback
    return;
  }
  //const soundfont = getSoundfontKey(s);
  let bufferSource;

  //if (soundfont) {
  // is soundfont
  //bufferSource = await globalThis.getFontBufferSource(soundfont, note || n, ac, freq);
  //} else {
  // is sample from loaded samples(..)
  bufferSource = await getSampleBufferSource(s, n, note, speed, freq, bank);
  //}
  // asny stuff above took too long?
  if (ac.currentTime > t) {
    logger(`[sampler] still loading sound "${s}:${n}"`, 'highlight');
    // console.warn('sample still loading:', s, n);
    return;
  }
  if (!bufferSource) {
    console.warn('no buffer source');
    return;
  }
  bufferSource.playbackRate.value = Math.abs(speed) * bufferSource.playbackRate.value;
  if (unit === 'c') {
    // are there other units?
    bufferSource.playbackRate.value = bufferSource.playbackRate.value * bufferSource.buffer.duration * cps;
  }
  const shouldClip = /* soundfont || */ clip;
  let duration = shouldClip ? hapDuration : bufferSource.buffer.duration / bufferSource.playbackRate.value;
  // "The computation of the offset into the sound is performed using the sound buffer's natural sample rate,
  // rather than the current playback rate, so even if the sound is playing at twice its normal speed,
  // the midway point through a 10-second audio buffer is still 5."
  const offset = begin * duration * bufferSource.playbackRate.value;
  duration = (end - begin) * duration;
  if (loop) {
    bufferSource.loop = true;
    bufferSource.loopStart = offset;
    bufferSource.loopEnd = offset + duration;
    duration = loop * duration;
  }
  const time = t + nudge;

  bufferSource.start(time, offset);
  if (cut !== undefined) {
    cutGroups[cut]?.stop(time); // fade out?
    cutGroups[cut] = bufferSource;
  }
  //chain.push(bufferSource);
  bufferSource.stop(t + duration + release);
  const adsr = getADSR(attack, decay, sustain, release, 1, time, time + duration);
  bufferSource.connect(adsr);
  //chain.push(adsr);
  return adsr;
}

/*const getSoundfontKey = (s) => {
  if (!globalThis.soundfontList) {
    // soundfont package not loaded
    return false;
  }
  if (globalThis.soundfontList?.instruments?.includes(s)) {
    return s;
  }
  // check if s is one of the soundfonts, which are loaded into globalThis, to avoid coupling both packages
  const nameIndex = globalThis.soundfontList?.instrumentNames?.indexOf(s);
  // convert number nameIndex (0-128) to 3 digit string (001-128)
  const name = nameIndex < 10 ? `00${nameIndex}` : nameIndex < 100 ? `0${nameIndex}` : nameIndex;
  if (nameIndex !== -1) {
    // TODO: indices of instrumentNames do not seem to match instruments
    return globalThis.soundfontList.instruments.find((instrument) => instrument.startsWith(name));
  }
  return;
};*/
