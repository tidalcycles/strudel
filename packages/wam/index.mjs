import { register, Pattern, toMidi, valueToMidi } from '@strudel.cycles/core';
import { getAudioContext } from '@strudel.cycles/webaudio';
import { initializeWamHost } from '@webaudiomodules/sdk';

// this is a map of all loaded WebAudioModules
let wams = {};

// this is a map of all WebAudioModule instances (possibly more than one per WAM)
let wamInstances = {};
export const getWamInstances = () => wamInstances;
export const getWamInstance = (key) => {
  if (!key) {
    throw new Error(`no .wam set`);
  }
  let instance = wamInstances[key];
  if (!instance) {
    throw new Error(`wam instance "${key}" not found`);
  }
  return instance;
};

// holds a promise of the wam host init
let hostInit;
// maps wam keys to init promises
let instanceInit = {};

// host groups of WAMs can interact with one another, but not directly across groups
const hostGroupId = 'strudel';

export const loadWAM = async function (name, url) {
  // memoized wam host init
  hostInit = hostInit || initializeWamHost(getAudioContext(), hostGroupId);
  await hostInit;
  // memoized wam file import
  wams[url] = wams[url] || import(/* @vite-ignore */ url);
  const { default: WAM } = await wams[url];

  const instance = new WAM(hostGroupId, getAudioContext());
  // memoized instance ini
  instanceInit[name] =
    instanceInit[name] ||
    instance.initialize().then(() => {
      instance.audioNode.connect(getAudioContext().destination);
      return instance;
    });

  // save loaded instance
  wamInstances[name] = await instanceInit[name];
  return wamInstances[name];
};

export const loadwam = loadWAM;
export const loadWam = loadWAM;

export const wam = register('wam', function (name, pat) {
  return pat.set({ wam: name }).addTrigger((time, hap) => {
    const i = getWamInstance(name);
    let note = toMidi(hap.value.note);
    let velocity = hap.context?.velocity ?? 0.75;
    let endTime = time + hap.duration.valueOf();

    i.audioNode.scheduleEvents({
      type: 'wam-midi',
      data: { bytes: [0x90, note, velocity] },
      time: time,
    });

    i.audioNode.scheduleEvents({
      type: 'wam-midi',
      data: { bytes: [0x80, note, 0] },
      time: endTime,
    });
  });
});

export const param = register('param', function (param, value, pat) {
  return pat.addTrigger((time, hap) => {
    const { wam } = hap.value;
    const i = getWamInstance(wam);
    i.audioNode.scheduleEvents({
      time: time,
      type: 'wam-automation',
      data: {
        id: param,
        normalized: false,
        value: value,
      },
    });
  });
});
