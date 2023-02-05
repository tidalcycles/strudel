import { logger, toMidi, valueToMidi } from '@strudel.cycles/core';
import { getAudioContext } from './index.mjs';
import { get, set } from 'idb-keyval';

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

export const getSampleBufferSource = async (s, n, note, speed, freq) => {
  let transpose = 0;
  if (freq !== undefined && note !== undefined) {
    logger('[sampler] hap has note and freq. ignoring note', 'warning');
  }
  let midi = valueToMidi({ freq, note }, 36);
  transpose = midi - 36; // C3 is middle C

  const ac = getAudioContext();
  // is sample from loaded samples(..)
  const samples = getLoadedSamples();
  if (!samples) {
    throw new Error('no samples loaded');
  }
  const bank = samples?.[s];
  if (!bank) {
    throw new Error(
      `sample not found: "${s}"`,
      // , try one of ${Object.keys(samples)
      // .map((s) => `"${s}"`)
      // .join(', ')}.
    );
  }
  if (typeof bank !== 'object') {
    throw new Error('wrong format for sample bank:', s);
  }
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

const useOfflineCache = true;

export const loadBuffer = async (url, ac, s, n = 0) => {
  const label = s ? `sound "${s}:${n}"` : 'sample';
  // only load if not already requested (loadCache = cache promises loading buffers by url)
  if (!loadCache[url]) {
    loadCache[url] = (async () => {
      logger(`[sampler] load ${label}..`, 'load-sample', { url });
      const timestamp = Date.now();
      if (useOfflineCache) {
        const cachedDataUrl = await get(url);
        if (cachedDataUrl) {
          // buffer has been loaded into offline cache in a previous session
          logger(`[sampler] load ${label}... done! found in offline cache!`, 'loaded-sample', { url });
          return dataUrlToAudioBuffer(ac, cachedDataUrl);
        }
      }
      // buffer not cached offline => fetch from url =>
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      if (useOfflineCache) {
        // we don't need to wait for the offline cache to finish here
        bufferToDataUrl(buf).then((dataUrl) => set(url, dataUrl));
      }
      const audioBuffer = await ac.decodeAudioData(buf);
      const took = Date.now() - timestamp;
      const size = humanFileSize(buf.byteLength);
      logger(`[sampler] load ${label}... done! loaded ${size} in ${took}ms`, 'loaded-sample', { url });
      bufferCache[url] = audioBuffer;
      return audioBuffer;
    })();
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

let sampleCache = { current: undefined };

/**
 * Loads a collection of samples to use with `s`
 *
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
  sampleCache.current = {
    ...sampleCache.current,
    ...Object.fromEntries(
      Object.entries(sampleMap).map(([key, value]) => {
        if (typeof value === 'string') {
          value = [value];
        }
        if (typeof value !== 'object') {
          throw new Error('wrong sample map format for ' + key);
        }
        baseUrl = value._base || baseUrl;
        const replaceUrl = (v) => (baseUrl + v).replace('github:', 'https://raw.githubusercontent.com/');
        if (Array.isArray(value)) {
          return [key, value.map(replaceUrl)];
        }
        // must be object
        return [
          key,
          Object.fromEntries(
            Object.entries(value).map(([note, samples]) => {
              return [note, (typeof samples === 'string' ? [samples] : samples).map(replaceUrl)];
            }),
          ),
        ];
      }),
    ),
  };
};

export const resetLoadedSamples = () => {
  sampleCache.current = undefined;
};

export const getLoadedSamples = () => sampleCache.current;

async function bufferToDataUrl(buf) {
  return new Promise((resolve) => {
    var blob = new Blob([buf], { type: 'application/octet-binary' });
    var reader = new FileReader();
    reader.onload = function (event) {
      resolve(event.target.result);
    };
    reader.readAsDataURL(blob);
  });
}

function dataUrlToAudioBuffer(ctx, dataUrl) {
  return fetch(dataUrl)
    .then((res) => res.arrayBuffer())
    .then((res) => ctx.decodeAudioData(res));
}
