import { logger } from '@strudel.cycles/core';

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

export const loadBuffer = (url, ac, s, n = 0) => {
  const label = s ? `sound "${s}:${n}"` : 'sample';
  if (!loadCache[url]) {
    logger(`[sampler] load ${label}..`, 'load-sample', { url });
    const timestamp = Date.now();
    loadCache[url] = fetch(url)
      .then((res) => res.arrayBuffer())
      .then(async (res) => {
        const took = (Date.now() - timestamp);
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
      const [_, path] = sampleMap.split('github:');
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
