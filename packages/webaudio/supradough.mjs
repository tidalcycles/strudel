import { Pattern } from '@strudel/core';
import { connectToDestination, getAudioContext, getWorklet } from 'superdough';

let doughWorklet;

function initDoughWorklet() {
  const ac = getAudioContext();
  doughWorklet = getWorklet(
    ac,
    'dough-processor',
    {},
    {
      outputChannelCount: [2],
    },
  );
  connectToDestination(doughWorklet); // channels?
}

const soundMap = new Map();
const loadedSounds = new Map();

Pattern.prototype.supradough = function () {
  return this.onTrigger((_, hap, __, cps, begin) => {
    hap.value._begin = begin;
    hap.value._duration = hap.duration / cps;
    !doughWorklet && initDoughWorklet();
    const s = (hap.value.bank ? hap.value.bank + '_' : '') + hap.value.s;
    const n = hap.value.n ?? 0;
    const soundKey = `${s}:${n}`;
    if (soundMap.has(s)) {
      hap.value.s = soundKey; // dough.mjs is unaware of bank and n (only maps keys to buffers)
    }
    if (soundMap.has(s) && !loadedSounds.has(soundKey)) {
      const urls = soundMap.get(s);
      const url = urls[n % urls.length];
      console.log(`load ${soundKey} from ${url}`);
      const loadSample = fetchSample(url);
      loadedSounds.set(soundKey, loadSample);
      loadSample.then(({ channels, sampleRate }) =>
        doughWorklet.port.postMessage({
          sample: soundKey,
          channels,
          sampleRate,
        }),
      );
    }

    doughWorklet.port.postMessage({ spawn: hap.value });
  }, 1);
};

function githubPath(base, subpath = '') {
  if (!base.startsWith('github:')) {
    throw new Error('expected "github:" at the start of pseudoUrl');
  }
  let [_, path] = base.split('github:');
  path = path.endsWith('/') ? path.slice(0, -1) : path;
  if (path.split('/').length === 2) {
    // assume main as default branch if none set
    path += '/main';
  }
  return `https://raw.githubusercontent.com/${path}/${subpath}`;
}
export async function fetchSampleMap(url) {
  if (url.startsWith('github:')) {
    url = githubPath(url, 'strudel.json');
  }
  if (url.startsWith('local:')) {
    url = `http://localhost:5432`;
  }
  if (url.startsWith('shabda:')) {
    let [_, path] = url.split('shabda:');
    url = `https://shabda.ndre.gr/${path}.json?strudel=1`;
  }
  if (url.startsWith('shabda/speech')) {
    let [_, path] = url.split('shabda/speech');
    path = path.startsWith('/') ? path.substring(1) : path;
    let [params, words] = path.split(':');
    let gender = 'f';
    let language = 'en-GB';
    if (params) {
      [language, gender] = params.split('/');
    }
    url = `https://shabda.ndre.gr/speech/${words}.json?gender=${gender}&language=${language}&strudel=1'`;
  }
  if (typeof fetch !== 'function') {
    // not a browser
    return;
  }
  const base = url.split('/').slice(0, -1).join('/');
  if (typeof fetch === 'undefined') {
    // skip fetch when in node / testing
    return;
  }
  const json = await fetch(url)
    .then((res) => res.json())
    .catch((error) => {
      console.error(error);
      throw new Error(`error loading "${url}"`);
    });
  return [json, json._base || base];
}

// for some reason, only piano and flute work.. is it because mp3??

async function fetchSample(url) {
  const buffer = await fetch(url)
    .then((res) => res.arrayBuffer())
    .then((buf) => getAudioContext().decodeAudioData(buf));
  let channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  return { channels, sampleRate: buffer.sampleRate };
}

export async function doughsamples(sampleMap, baseUrl) {
  if (typeof sampleMap === 'string') {
    const [json, base] = await fetchSampleMap(sampleMap);
    // console.log('json', json, 'base', base);
    return doughsamples(json, base);
  }
  Object.entries(sampleMap).map(async ([key, urls]) => {
    if (key !== '_base') {
      urls = urls.map((url) => baseUrl + url);
      // console.log('set', key, urls);
      soundMap.set(key, urls);
    }
  });
}
