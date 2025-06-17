// this file contains a runtime scope for testing all the tunes
// it mocks all the functions that won't work in node (who are not important for testing values / structure)
// it might require mocking more stuff when tunes added that use other functions

// import * as tunes from './tunes.mjs';
import { evaluate } from '@strudel/transpiler';
import { evalScope } from '@strudel/core';
import * as strudel from '@strudel/core';
import * as webaudio from '@strudel/webaudio';
// import gist from '@strudel/core/gist.js';
import { mini, m } from '@strudel/mini/mini.mjs';
// import * as voicingHelpers from '@strudel/tonal/voicings.mjs';
// import euclid from '@strudel/core/euclid.mjs';
//import '@strudel/midi/midi.mjs';
import * as tonalHelpers from '@strudel/tonal';
import '@strudel/xen/xen.mjs';
// import '@strudel/xen/tune.mjs';
// import '@strudel/core/euclid.mjs';
// import '@strudel/core/speak.mjs'; // window is not defined
// import '@strudel/osc/osc.mjs';
// import '@strudel/webaudio/webaudio.mjs';
// import '@strudel/serial/serial.mjs';
import '../website/src/repl/piano';
//import * as motionHelpers from '../packages/motion/index.mjs';
//import * as geolocationHelpers from '../packages/geolocation/index.mjs';
//import * as gamepadHelpers from '../packages/gamepad/index.mjs';

class MockedNode {
  chain() {
    return this;
  }
  connect() {
    return this;
  }
  toDestination() {
    return this;
  }
  set() {
    return this;
  }
  start() {
    return this;
  }
}

const mockNode = () => new MockedNode();

const id = (x) => x;

const toneHelpersMocked = {
  FeedbackDelay: MockedNode,
  MembraneSynth: MockedNode,
  NoiseSynth: MockedNode,
  MetalSynth: MockedNode,
  Synth: MockedNode,
  PolySynth: MockedNode,
  Chorus: MockedNode,
  Freeverb: MockedNode,
  Gain: MockedNode,
  Reverb: MockedNode,
  vol: mockNode,
  out: id,
  osc: id,
  samples: id,
  adsr: id,
  getDestination: id,
  players: mockNode,
  sampler: mockNode,
  synth: mockNode,
  piano: mockNode,
  polysynth: mockNode,
  fmsynth: mockNode,
  membrane: mockNode,
  noise: mockNode,
  metal: mockNode,
  lowpass: mockNode,
  highpass: mockNode,
};

[
  'osc',
  'csound',
  'tone',
  'webdirt',
  'pianoroll',
  'speak',
  'wave',
  'filter',
  'adsr',
  'webaudio',
  'soundfont',
  'tune',
  'midi',
  '_scope',
  '_spiral',
  '_pitchwheel',
  '_pianoroll',
  '_spectrum',
  'markcss',
].forEach((mock) => {
  strudel.Pattern.prototype[mock] = function () {
    return this;
  };
});

const uiHelpersMocked = {
  backgroundImage: id,
};

const canvasCtx = {
  clearRect: () => {},
  fillText: () => {},
  fillRect: () => {},
  canvas: {
    width: 100,
    height: 100,
  },
};
const audioCtx = {
  currentTime: 1,
};
const getDrawContext = () => canvasCtx;
const getAudioContext = () => audioCtx;
const loadSoundfont = () => {};
const loadCsound = () => {};
const loadCSound = () => {};
const loadcsound = () => {};

const midin = () => {
  return (ccNum) => strudel.ref(() => 0); // returns ref with default value 0
};

const sysex = ([id, data]) => {};

// TODO: refactor to evalScope
evalScope(
  // Tone,
  strudel,
  toneHelpersMocked,
  uiHelpersMocked,
  webaudio,
  tonalHelpers,
  /*
  gamepadHelpers,
  toneHelpers,
  voicingHelpers,
  drawHelpers,
  uiHelpers,
  */
  {
    midin,
    sysex,
    // gist,
    // euclid,
    csound: id,
    loadOrc: id,
    mini,
    m,
    getDrawContext,
    getAudioContext,
    loadSoundfont,
    loadCSound,
    loadCsound,
    loadcsound,
    setcps: id,
    Clock: {}, // whatever
  },
);

// TBD: use transpiler to support labeled statements
export const queryCode = async (code, cycles = 1) => {
  const { pattern } = await evaluate(code);
  const haps = pattern.sortHapsByPart().queryArc(0, cycles);
  return haps.map((h) => h.show(true));
};

export const testCycles = {
  timeCatMini: 16,
  timeCat: 8,
  shapeShifted: 16,
  tetrisMini: 16,
  whirlyStrudel: 16,
  swimming: 51,
  giantSteps: 20,
  giantStepsReggae: 25,
  transposedChordsHacked: 8,
  scaleTranspose: 16,
  struct: 4,
  magicSofa: 8,
  confusedPhone: 8,
  zeldasRescue: 48,
  technoDrums: 4,
  caverave: 60,
  callcenterhero: 22,
  primalEnemy: 4,
  synthDrums: 4,
  sampleDrums: 4,
  xylophoneCalling: 60,
  sowhatelse: 60,
  barryHarris: 64,
  wavyKalimba: 64,
  jemblung: 12,
  risingEnemy: 12,
  festivalOfFingers: 16,
  festivalOfFingers2: 22,
  undergroundPlumber: 20,
  bridgeIsOver: 8,
  goodTimes: 16,
  echoPiano: 8,
  sml1: 48,
  speakerman: 48,
  randomBells: 24,
  waa: 16,
  waar: 16,
  festivalOfFingers3: 16,
};

// fixed: https://strudel.cc/?DBp75NUfSxIn (missing .note())
// bug: https://strudel.cc/?xHaKTd1kTpCn + https://strudel.cc/?o5LLePbx8kiQ
