import { Tone } from '@strudel.cycles/tone';
import { evalScope } from '@strudel.cycles/eval';
import { MiniRepl as _MiniRepl } from '@strudel.cycles/react';
import controls from '@strudel.cycles/core/controls.mjs';
import { loadWebDirt } from '@strudel.cycles/webdirt';
import { samples } from '@strudel.cycles/webaudio';

export const defaultSynth = new Tone.PolySynth().chain(new Tone.Gain(0.5), Tone.Destination).set({
  oscillator: { type: 'triangle' },
  envelope: {
    release: 0.01,
  },
});

fetch('https://strudel.tidalcycles.org/EmuSP12.json')
  .then((res) => res.json())
  .then((json) => samples(json, 'https://strudel.tidalcycles.org/EmuSP12/'));


evalScope(
  Tone,
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/webdirt'),
);

loadWebDirt({
  sampleMapUrl: '../EmuSP12.json',
  sampleFolder: '../EmuSP12',
});

export function MiniRepl({ tune }) {
  return <_MiniRepl tune={tune} defaultSynth={defaultSynth} hideOutsideView={true} />;
}
