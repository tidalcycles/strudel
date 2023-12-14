import { logger, getDrawContext, silence, controls, evalScope, hash2code, code2hash } from '@strudel.cycles/core';
import { StrudelMirror } from '@strudel/codemirror';
import { transpiler } from '@strudel.cycles/transpiler';
import {
  getAudioContext,
  webaudioOutput,
  registerSynthSounds,
  registerZZFXSounds,
  samples,
} from '@strudel.cycles/webaudio';
import './vanilla.css';

let editor;
const initialSettings = {
  keybindings: 'codemirror',
  isLineNumbersDisplayed: true,
  isActiveLineHighlighted: true,
  isAutoCompletionEnabled: false,
  isPatternHighlightingEnabled: true,
  isFlashEnabled: true,
  isTooltipEnabled: false,
  isLineWrappingEnabled: false,
  theme: 'teletext',
  fontFamily: 'monospace',
  fontSize: 18,
};

async function run() {
  const container = document.getElementById('code');
  if (!container) {
    console.warn('could not init: no container found');
    return;
  }

  const drawContext = getDrawContext();
  const drawTime = [-2, 2];
  editor = new StrudelMirror({
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    root: container,
    initialCode: '// LOADING',
    pattern: silence,
    settings: initialSettings,
    drawTime,
    onDraw: (haps, time, frame, painters) => {
      painters.length && drawContext.clearRect(0, 0, drawContext.canvas.width * 2, drawContext.canvas.height * 2);
      painters?.forEach((painter) => {
        // ctx time haps drawTime paintOptions
        painter(drawContext, time, haps, drawTime, { clear: false });
      });
    },
    prebake: async () => {
      // populate scope / lazy load modules
      const modulesLoading = evalScope(
        import('@strudel.cycles/core'),
        import('@strudel.cycles/tonal'),
        import('@strudel.cycles/mini'),
        // import('@strudel.cycles/xen'),
        import('@strudel.cycles/webaudio'),
        import('@strudel/codemirror'),
        /* import('@strudel/hydra'), */
        // import('@strudel.cycles/serial'),
        /* import('@strudel.cycles/soundfonts'), */
        // import('@strudel.cycles/csound'),
        /* import('@strudel.cycles/midi'), */
        // import('@strudel.cycles/osc'),
        controls, // sadly, this cannot be exported from core directly (yet)
      );
      // load samples
      const ds = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/';
      await Promise.all([
        modulesLoading,
        registerSynthSounds(),
        registerZZFXSounds(),
        samples(`${ds}/tidal-drum-machines.json`),
        samples(`${ds}/piano.json`),
        samples(`${ds}/Dirt-Samples.json`),
        samples(`${ds}/EmuSP12.json`),
        samples(`${ds}/vcsl.json`),
      ]);
    },
    afterEval: ({ code }) => {
      window.location.hash = '#' + code2hash(code);
    },
  });

  // init settings
  editor.updateSettings(initialSettings);

  logger(`Welcome to Strudel! Click into the editor and then hit ctrl+enter to run the code!`, 'highlight');
  const codeParam = window.location.href.split('#')[1] || '';

  const initialCode = codeParam
    ? hash2code(codeParam)
    : `// @date 23-11-30
// "teigrührgerät" @by froos

stack(
  stack(
    s("bd(<3!3 5>,6)/2").bank('RolandTR707')
    ,
    s("~ sd:<0 1>").bank('RolandTR707').room("<0 .5>")
    .lastOf(8, x=>x.segment("12").end(.2).gain(isaw))
    ,
    s("[tb ~ tb]").bank('RolandTR707')
    .clip(0).release(.08).room(.2)
  ).off(-1/6, x=>x.speed(.7).gain(.2).degrade())
  ,
  stack(
    note("<g1(<3 4>,6) ~!2 [f1?]*2>")
    .s("sawtooth").lpf(perlin.range(400,1000))
    .lpa(.1).lpenv(-3).room(.2)
    .lpq(8).noise(.2)
    .add(note("0,.1"))
    ,
    chord("<~ Gm9 ~!2>")
    .dict('ireal').voicing()
    .s("sawtooth").vib("2:.1")
    .lpf(1000).lpa(.1).lpenv(-4)
    .room(.5)
    ,
    n(run(3)).chord("<Gm9 Gm11>/8")
    .dict('ireal-ext')
    .off(1/2, add(n(4)))
    .voicing()
    .clip(.1).release(.05)
    .s("sine").jux(rev)
    .sometimesBy(sine.slow(16), add(note(12)))
    .room(.75)
    .lpf(sine.range(200,2000).slow(16))
    .gain(saw.slow(4).div(2))
  ).add(note(perlin.range(0,.5)))
)`;

  editor.setCode(initialCode); // simpler alternative to above init

  // settingsMap.listen((settings, key) => editor.changeSetting(key, settings[key]));
  onEvent('strudel-toggle-play', () => editor.toggle());
}

run();

function onEvent(key, callback) {
  const listener = (e) => {
    if (e.data === key) {
      callback();
    }
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

// settings form
function getInput(form, name) {
  return form.querySelector(`input[name=${name}]`) || form.querySelector(`select[name=${name}]`);
}
function getFormValues(form, initial) {
  const entries = Object.entries(initial).map(([key, initialValue]) => {
    const input = getInput(form, key);
    if (!input) {
      return [key, initialValue]; // fallback
    }
    if (input.type === 'checkbox') {
      return [key, input.checked];
    }
    if (input.type === 'number') {
      return [key, Number(input.value)];
    }
    if (input.tagName === 'SELECT') {
      return [key, input.value];
    }
    return [key, input.value];
  });
  return Object.fromEntries(entries);
}
function setFormValues(form, values) {
  Object.entries(values).forEach(([key, value]) => {
    const input = getInput(form, key);
    if (!input) {
      return;
    }
    if (input.type === 'checkbox') {
      input.checked = !!value;
    } else if (input.type === 'number') {
      input.value = value;
    } else if (input.tagName) {
      input.value = value;
    }
  });
}

const form = document.querySelector('form[name=settings]');
setFormValues(form, initialSettings);
form.addEventListener('change', () => {
  const values = getFormValues(form, initialSettings);
  // console.log('values', values);
  editor.updateSettings(values);
});
