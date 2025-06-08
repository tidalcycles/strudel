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

async function loadSampleChannels(url) {
  const buffer = await fetch(url)
    .then((res) => res.arrayBuffer())
    .then((buf) => getAudioContext().decodeAudioData(buf));
  // console.log('buffer', buffer, buffer.numberOfChannels);
  let channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  return channels;
}

let samples = {
  casio: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/casio/high.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/casio/low.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/casio/noise.wav',
  ],
  crow: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/crow/000_crow.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/crow/001_crow2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/crow/002_crow3.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/crow/003_crow4.wav',
  ],
  insect: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/insect/000_everglades_conehead.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/insect/001_robust_shieldback.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/insect/002_seashore_meadow_katydid.wav',
  ],
  wind: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/000_wind1.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/001_wind10.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/002_wind2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/003_wind3.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/004_wind4.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/005_wind5.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/006_wind6.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/007_wind7.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/008_wind8.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/wind/009_wind9.wav',
  ],
  jazz: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/000_BD.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/001_CB.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/002_FX.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/003_HH.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/004_OH.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/005_P1.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/006_P2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/jazz/007_SN.wav',
  ],
  metal: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/000_0.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/001_1.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/002_2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/003_3.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/004_4.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/005_5.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/006_6.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/007_7.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/008_8.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/metal/009_9.wav',
  ],
  east: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/000_nipon_wood_block.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/001_ohkawa_mute.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/002_ohkawa_open.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/003_shime_hi.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/004_shime_hi_2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/005_shime_mute.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/006_taiko_1.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/007_taiko_2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/east/008_taiko_3.wav',
  ],
  space: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/000_0.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/001_1.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/002_11.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/003_12.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/004_13.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/005_14.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/006_15.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/007_16.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/008_17.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/009_18.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/010_2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/011_3.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/012_4.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/013_5.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/014_6.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/015_7.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/016_8.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/space/017_9.wav',
  ],
  numbers: [
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/0.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/1.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/2.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/3.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/4.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/5.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/6.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/7.wav',
    'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/numbers/8.wav',
  ],
  piano: ['https://raw.githubusercontent.com/felixroos/dough-samples/refs/heads/main/piano/A3v8.mp3'],
  flute: ['https://raw.githubusercontent.com/felixroos/samples/refs/heads/main/flute/c4.mp3'],
  bd: [
    'https://raw.githubusercontent.com/geikha/tidal-drum-machines/15eac73c5e878550f91d864a4863e014799403f1/machines/RolandTR909/rolandtr909-bd/Bassdrum-01.wav',
  ],
};
// for some reason, only piano and flute work.. is it because mp3??

let loaded = false;
export async function doughsample() {
  !doughWorklet && initDoughWorklet();
  if (loaded) {
    return;
  }
  loaded = true;
  const sampleMap = await Promise.all(
    Object.entries(samples).map(async ([key, url]) => {
      url = url[0];
      console.log(key, 'url', url);
      return [key, await loadSampleChannels(url)];
    }),
  );
  console.log('sampleMap', sampleMap);
  doughWorklet.port.postMessage({ samples: sampleMap });
}
