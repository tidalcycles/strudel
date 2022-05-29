const bufferCache = {}; // string: Promise<ArrayBuffer>

export const loadBuffer = (url, ac) => {
  if (!bufferCache[url]) {
    bufferCache[url] = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((res) => ac.decodeAudioData(res));
  }
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
let loaded;
export const loadGithubSamples = async (path, nameFn) => {
  const storageKey = 'loadGithubSamples ' + path;
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    return JSON.parse(stored);
  }
  if (githubCache[path]) {
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
  loaded = githubCache[path];
  localStorage.setItem(storageKey, JSON.stringify(loaded));
  console.log('[sampler]: loaded samples:', loaded);
  return githubCache[path];
};

export const getLoadedSamples = () => loaded;
