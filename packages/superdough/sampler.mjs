import { noteToMidi, valueToMidi, nanFallback } from './util.mjs';
import { getAudioContext, registerSound } from './index.mjs';
import { getEnvelope } from './helpers.mjs';
import { logger } from './logger.mjs';

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

export const getSampleBufferSource = async (s, n, note, speed, freq, bank, resolveUrl) => {
  let transpose = 0;
  if (freq !== undefined && note !== undefined) {
    logger('[sampler] hap has note and freq. ignoring note', 'warning');
  }
  let midi = valueToMidi({ freq, note }, 36);
  transpose = midi - 36; // C3 is middle C

  const ac = getAudioContext();
  let sampleUrl;
  if (Array.isArray(bank)) {
    n = nanFallback(n, 0);
    sampleUrl = bank[n % bank.length];
  } else {
    const midiDiff = (noteA) => noteToMidi(noteA) - midi;
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
  if (resolveUrl) {
    sampleUrl = await resolveUrl(sampleUrl);
  }
  let buffer = await loadBuffer(sampleUrl, ac, s, n);
  if (speed < 0) {
    // should this be cached?
    buffer = reverseBuffer(buffer);
  }
  const bufferSource = ac.createBufferSource();
  bufferSource.buffer = buffer;
  const playbackRate = 1.0 * Math.pow(2, transpose / 12);
  bufferSource.playbackRate.value = playbackRate;
  return bufferSource;
};

export const loadBuffer = (url, ac, s, n = 0) => {
  const label = s ? `sound "${s}:${n}"` : 'sample';
  url = url.replace('#', '%23');
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

export const processSampleMap = (sampleMap, fn, baseUrl = sampleMap._base || '') => {
  return Object.entries(sampleMap).forEach(([key, value]) => {
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
    fn(key, value);
  });
};

// allows adding a custom url prefix handler
// for example, it is used by the desktop app to load samples starting with '~/music'
let resourcePrefixHandlers = {};
export function registerSamplesPrefix(prefix, resolve) {
  resourcePrefixHandlers[prefix] = resolve;
}
// finds a prefix handler for the given url (if any)
function getSamplesPrefixHandler(url) {
  const handler = Object.entries(resourcePrefixHandlers).find(([key]) => url.startsWith(key));
  if (handler) {
    return handler[1];
  }
  return;
}

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
 * @example
 * samples('shabda:noise,chimp:2')
 * s("noise <chimp:0*2 chimp:1>")
 * @example
 * samples('shabda/speech/fr-FR/f:chocolat')
 * s("chocolat*4")
 */

export const samples = async (sampleMap, baseUrl = sampleMap._base || '', options = {}) => {
  if (typeof sampleMap === 'string') {
    // check if custom prefix handler
    const handler = getSamplesPrefixHandler(sampleMap);
    if (handler) {
      return handler(sampleMap);
    }
    if (sampleMap.startsWith('bubo:')) {
      const [_, repo] = sampleMap.split(':');
      sampleMap = `github:Bubobubobubobubo/dough-${repo}`;
    }
    if (sampleMap.startsWith('github:')) {
      let [_, path] = sampleMap.split('github:');
      path = path.endsWith('/') ? path.slice(0, -1) : path;
      if (path.split('/').length === 2) {
        // assume main as default branch if none set
        path += '/main';
      }
      sampleMap = `https://raw.githubusercontent.com/${path}/strudel.json`;
    }
    if (sampleMap.startsWith('shabda:')) {
      let [_, path] = sampleMap.split('shabda:');
      sampleMap = `https://shabda.ndre.gr/${path}.json?strudel=1`;
    }
    if (sampleMap.startsWith('shabda/speech')) {
      let [_, path] = sampleMap.split('shabda/speech');
      path = path.startsWith('/') ? path.substring(1) : path;
      let [params, words] = path.split(':');
      let gender = 'f';
      let language = 'en-GB';
      if (params) {
        [language, gender] = params.split('/');
      }
      sampleMap = `https://shabda.ndre.gr/speech/${words}.json?gender=${gender}&language=${language}&strudel=1'`;
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
      .then((json) => samples(json, baseUrl || json._base || base, options))
      .catch((error) => {
        console.error(error);
        throw new Error(`error loading "${sampleMap}"`);
      });
  }
  const { prebake, tag } = options;
  processSampleMap(
    sampleMap,
    (key, value) =>
      registerSound(key, (t, hapValue, onended) => onTriggerSample(t, hapValue, onended, value), {
        type: 'sample',
        samples: value,
        baseUrl,
        prebake,
        tag,
      }),
    baseUrl,
  );
};

const cutGroups = [];

export async function onTriggerSample(t, value, onended, bank, resolveUrl) {
  let {
    s,
    freq,
    unit,
    nudge = 0, // TODO: is this in seconds?
    cut,
    loop,
    clip = undefined, // if 1, samples will be cut off when the hap ends
    n = 0,
    note,
    speed = 1, // sample playback speed
    loopBegin = 0,
    begin = 0,
    loopEnd = 1,
    end = 1,
    vib,
    vibmod = 0.5,
  } = value;
  // load sample
  if (speed === 0) {
    // no playback
    return;
  }
  loop = s.startsWith('wt_') ? 1 : value.loop;
  const ac = getAudioContext();
  // destructure adsr here, because the default should be different for synths and samples
  const { attack = 0.001, decay = 0.001, sustain = 1, release = 0.001 } = value;
  //const soundfont = getSoundfontKey(s);
  const time = t + nudge;

  const bufferSource = await getSampleBufferSource(s, n, note, speed, freq, bank, resolveUrl);

  // vibrato
  let vibratoOscillator;
  if (vib > 0) {
    vibratoOscillator = getAudioContext().createOscillator();
    vibratoOscillator.frequency.value = vib;
    const gain = getAudioContext().createGain();
    // Vibmod is the amount of vibrato, in semitones
    gain.gain.value = vibmod * 100;
    vibratoOscillator.connect(gain);
    gain.connect(bufferSource.detune);
    vibratoOscillator.start(0);
  }

  // asny stuff above took too long?
  if (ac.currentTime > t) {
    logger(`[sampler] still loading sound "${s}:${n}"`, 'highlight');
    // console.warn('sample still loading:', s, n);
    return;
  }
  if (!bufferSource) {
    logger(`[sampler] could not load "${s}:${n}"`, 'error');
    return;
  }
  bufferSource.playbackRate.value = Math.abs(speed) * bufferSource.playbackRate.value;
  if (unit === 'c') {
    // are there other units?
    bufferSource.playbackRate.value = bufferSource.playbackRate.value * bufferSource.buffer.duration * 1; //cps;
  }
  // "The computation of the offset into the sound is performed using the sound buffer's natural sample rate,
  // rather than the current playback rate, so even if the sound is playing at twice its normal speed,
  // the midway point through a 10-second audio buffer is still 5."
  const offset = begin * bufferSource.buffer.duration;
  if (loop) {
    bufferSource.loop = true;
    bufferSource.loopStart = loopBegin * bufferSource.buffer.duration - offset;
    bufferSource.loopEnd = loopEnd * bufferSource.buffer.duration - offset;
  }
  bufferSource.start(time, offset);
  const { node: envelope, stop: releaseEnvelope } = getEnvelope(attack, decay, sustain, release, 1, t);
  bufferSource.connect(envelope);
  const out = ac.createGain(); // we need a separate gain for the cutgroups because firefox...
  envelope.connect(out);
  bufferSource.onended = function () {
    bufferSource.disconnect();
    vibratoOscillator?.stop();
    envelope.disconnect();
    out.disconnect();
    onended();
  };
  const stop = (endTime, playWholeBuffer = clip === undefined && loop === undefined) => {
    let releaseTime = endTime;
    if (playWholeBuffer) {
      const bufferDuration = bufferSource.buffer.duration / bufferSource.playbackRate.value;
      releaseTime = t + (end - begin) * bufferDuration;
    }
    bufferSource.stop(releaseTime + release);
    releaseEnvelope(releaseTime);
  };
  const handle = { node: out, bufferSource, stop };

  // cut groups
  if (cut !== undefined) {
    const prev = cutGroups[cut];
    if (prev) {
      prev.node.gain.setValueAtTime(1, time);
      prev.node.gain.linearRampToValueAtTime(0, time + 0.01);
    }
    cutGroups[cut] = handle;
  }

  return handle;
}
