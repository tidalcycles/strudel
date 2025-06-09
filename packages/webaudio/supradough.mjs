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

Pattern.prototype.supradough = function () {
  return this.onTrigger((_, hap, __, cps, begin) => {
    hap.value._begin = begin;
    hap.value._duration = hap.duration / cps;
    !doughWorklet && initDoughWorklet();
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

async function loadSampleChannels(key, url) {
  const buffer = await fetch(url)
    .then((res) => res.arrayBuffer())
    .then((buf) => getAudioContext().decodeAudioData(buf));
  let channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  return [key, channels, buffer.sampleRate];
}

let loaded = false;
export async function doughsamples(sampleMap, baseUrl) {
  if (typeof sampleMap === 'string') {
    const [json, base] = await fetchSampleMap(sampleMap);
    // console.log('json', json, 'base', base);
    return doughsamples(json, base);
  }
  !doughWorklet && initDoughWorklet();
  if (loaded) {
    return;
  }
  loaded = true;
  const json = (
    await Promise.all(
      Object.entries(sampleMap).map(async ([key, url]) => {
        if (key !== '_base') {
          url = baseUrl + url[0];
          return loadSampleChannels(key, url);
        }
      }),
    )
  ).filter(Boolean);
  // console.log('sampleMap', json);
  doughWorklet.port.postMessage({ samples: json });
}
