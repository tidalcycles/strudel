// this file is unused, but still contains the commented parts of the main repl

import {
  /* logger, */ getDrawContext,
  silence,
  controls,
  evalScope /* , hash2code, code2hash */,
} from '@strudel.cycles/core';
import { StrudelMirror } from '@strudel/codemirror';
import { getAudioContext, webaudioOutput /* , resetLoadedSounds */ } from '@strudel.cycles/webaudio';
import { transpiler } from '@strudel.cycles/transpiler';
import { registerSynthSounds, registerZZFXSounds, samples } from '@strudel.cycles/webaudio';
import './style.css';

//import { prebake, resetSounds } from './prebake.mjs';
//import { settingsMap } from '@src/settings.mjs';
//import { setLatestCode } from '../settings.mjs';
//import { createClient } from '@supabase/supabase-js';
//import { getRandomTune } from './helpers.mjs';

/* const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
); */

/* async function initCodeFromUrl() {
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  // load code from url hash (either short hash from database or decode long hash)
  try {
    const initialUrl = window.location.href;
    const hash = initialUrl.split('?')[1]?.split('#')?.[0];
    const codeParam = window.location.href.split('#')[1] || '';
    // looking like https://strudel.cc/?J01s5i1J0200 (fixed hash length)
    if (codeParam) {
      // looking like https://strudel.cc/#ImMzIGUzIg%3D%3D (hash length depends on code length)
      return hash2code(codeParam);
    } else if (hash) {
      return supabase
        .from('code')
        .select('code')
        .eq('hash', hash)
        .then(({ data, error }) => {
          if (error) {
            console.warn('failed to load hash', error);
          }
          if (data.length) {
            //console.log('load hash from database', hash);
            return data[0].code;
          }
        });
    }
  } catch (err) {
    console.warn('failed to decode', err);
  }
} 
const initialCode = initCodeFromUrl();
*/

async function run() {
  const container = document.getElementById('code');
  if (!container) {
    console.warn('could not init: no container found');
    return;
  }

  // Create a single supabase client for interacting with your database

  // const settings = settingsMap.get();
  // defaultSettings from settings.mjs
  const settings = {
    activeFooter: 'intro',
    keybindings: 'codemirror',
    isLineNumbersDisplayed: true,
    isActiveLineHighlighted: true,
    isAutoCompletionEnabled: false,
    isPatternHighlightingEnabled: true,
    isFlashEnabled: true,
    isTooltipEnabled: false,
    isLineWrappingEnabled: false,
    theme: 'strudelTheme',
    fontFamily: 'monospace',
    fontSize: 18,
    latestCode: '',
    isZen: false,
    soundsFilter: 'all',
    panelPosition: 'bottom',
    userPatterns: '{}',
  };

  const drawContext = getDrawContext();
  const drawTime = [-2, 2];
  const editor = new StrudelMirror({
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    root: container,
    initialCode: '// LOADING',
    pattern: silence,
    settings,
    drawTime,
    onDraw: (haps, time, frame, painters) => {
      painters.length && drawContext.clearRect(0, 0, drawContext.canvas.width * 2, drawContext.canvas.height * 2);
      painters?.forEach((painter) => {
        // ctx time haps drawTime paintOptions
        painter(drawContext, time, haps, drawTime, { clear: false });
      });
    },
    prebake: async () => {
      // prebake()

      // "old" style prebake copied from Repl.jsx
      let modules = [
        import('@strudel.cycles/core'),
        import('@strudel.cycles/tonal'),
        import('@strudel.cycles/mini'),
        import('@strudel.cycles/xen'),
        import('@strudel.cycles/webaudio'),
        import('@strudel/codemirror'),
        import('@strudel/hydra'),
        import('@strudel.cycles/serial'),
        import('@strudel.cycles/soundfonts'),
        import('@strudel.cycles/csound'),
      ];
      /* if (isTauri()) {
        modules = modules.concat([
          import('@strudel/desktopbridge/loggerbridge.mjs'),
          import('@strudel/desktopbridge/midibridge.mjs'),
          import('@strudel/desktopbridge/oscbridge.mjs'),
        ]);
      } else { */
      modules = modules.concat([import('@strudel.cycles/midi'), import('@strudel.cycles/osc')]);
      //}
      const modulesLoading = evalScope(
        controls, // sadly, this cannot be exported from core direclty
        // settingPatterns,
        ...modules,
      );
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
      // setLatestCode(code);
      // window.location.hash = '#' + code2hash(code);
    },
  });

  // init settings
  editor.updateSettings(settings);

  /* const decoded = await initialCode;
  let msg;
  if (decoded) {
    editor.setCode(decoded);
    msg = `I have loaded the code from the URL.`;
  } else if (settings.latestCode) {
    editor.setCode(settings.latestCode);
    msg = `Your last session has been loaded!`;
  } else {
    const { code: randomTune, name } = getRandomTune();
    editor.setCode(randomTune);
    msg = `A random code snippet named "${name}" has been loaded!`;
  }
  logger(`Welcome to Strudel! ${msg} Press play or hit ctrl+enter to run it!`, 'highlight'); */
  // setPending(false);

  const initialCode = `// @date 23-11-30
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
  /* onEvent('strudel-shuffle', async () => {
    const { code, name } = getRandomTune();
    logger(`[repl] ✨ loading random tune "${name}"`);
    console.log(code);
    editor.setCode(code);
    // await resetSounds(); // <-- "new" style
    // old style
    resetLoadedSounds();
    editor.repl.setCps(1);
    editor.repl.evaluate(code, false);
  }); */

  // const isEmbedded = embedded || window.location !== window.parent.location;
}

/* let inited = false;
onEvent('strudel-container', () => {
  if (!inited) {
    inited = true;
    run();
  }
}); */
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
