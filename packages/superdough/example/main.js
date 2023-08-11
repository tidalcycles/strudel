import { superdough, samples, initAudioOnFirstClick, registerSynthSounds } from 'superdough';

initAudioOnFirstClick();

const load = Promise.all([samples('github:tidalcycles/Dirt-Samples/master'), registerSynthSounds()]);

let button = document.getElementById('play');

const loop = (t = 0) => {
  superdough({ s: 'bd', delay: 0.5 }, t);
  superdough({ note: 'g1', s: 'sawtooth', cutoff: 600, resonance: 8 }, t, 0.125);
  superdough({ note: 'g2', s: 'sawtooth', cutoff: 600, resonance: 8 }, t + 0.25, 0.125);
  superdough({ s: 'hh' }, t + 0.25);
  superdough({ s: 'sd', room: 0.5 }, t + 0.5);
  superdough({ s: 'hh' }, t + 0.75);
};

button.addEventListener('click', async () => {
  console.log('play');
  await load;
  let t = 0.1;
  while (t < 16) {
    loop(t++);
  }
});
