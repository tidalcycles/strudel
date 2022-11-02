const bufferCache = {}; // string: Promise<ArrayBuffer>
const loadCache = {}; // string: Promise<ArrayBuffer>

export const getCachedBuffer = (url) => bufferCache[url];

export const loadBuffer = (url, ac) => {
  if (!loadCache[url]) {
    loadCache[url] = fetch(url)
      .then((res) => res.arrayBuffer())
      .then(async (res) => {
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

/* export const playBuffer = (buffer, time = ac.currentTime, destination = ac.destination) => {
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.connect(destination);
  src.start(time);
};

export const playSample = async (url) => playBuffer(await loadBuffer(url)); */

// https://estuary.mcmaster.ca/samples/resources.json
// Array<{ "url":string, "bank": string, "n": number}>
// ritchse/tidal-drum-machines/tree/main/machines/AkaiLinn
const githubCache = {};
let sampleCache = { current: undefined };
export const loadGithubSamples = async (path, nameFn) => {
  const storageKey = 'loadGithubSamples ' + path;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    console.log('[sampler]: loaded sample list from localstorage', path);
    githubCache[path] = JSON.parse(stored);
  }
  if (githubCache[path]) {
    sampleCache.current = githubCache[path];
    return githubCache[path];
  }
  console.log('[sampler]: fetching sample list from github', path);
  try {
    const [user, repo, ...folders] = path.split('/');
    const baseUrl = `https://api.github.com/repos/${user}/${repo}/contents`;
    const banks = await fetch(`${baseUrl}/${folders.join('/')}`).then((res) => res.json());
    // fetch each subfolder
    githubCache[path] = (
      await Promise.all(
        banks.map(async ({ name, path }) => ({
          name,
          content: await fetch(`${baseUrl}/${path}`)
            .then((res) => res.json())
            .catch((err) => {
              console.error('could not load path', err);
            }),
        })),
      )
    )
      .filter(({ content }) => !!content)
      .reduce(
        (acc, { name, content }) => ({
          ...acc,
          [nameFn?.(name) || name]: content.map(({ download_url }) => download_url),
        }),
        {},
      );
  } catch (err) {
    console.error('[sampler]: failed to fetch sample list from github', err);
    return;
  }
  sampleCache.current = githubCache[path];
  localStorage.setItem(storageKey, JSON.stringify(sampleCache.current));
  console.log('[sampler]: loaded samples:', sampleCache.current);
  return githubCache[path];
};

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
    const base = sampleMap.split('/').slice(0, -1).join('/');
    return fetch(sampleMap)
      .then((res) => res.json())
      .then((json) => samples(json, json._base || base));
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
