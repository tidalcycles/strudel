import { StrudelMirror } from '@strudel/codemirror';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import { transpiler } from '@strudel.cycles/transpiler';
import { prebake } from './prebake.mjs';
import { settingsMap } from '@src/settings.mjs';
import { themes } from '@src/repl/themes.mjs';
import { setLatestCode } from '../settings.mjs';
import { hash2code, code2hash } from './helpers.mjs';
import { createClient } from '@supabase/supabase-js';
import * as tunes from './tunes.mjs';

const onEvent = (key, callback) => {
  const listener = (e) => {
    if (e.data === key) {
      callback();
    }
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
};

function run() {
  const { latestCode } = settingsMap.get();

  /* let clearCanvas;
if (typeof window !== 'undefined') {
  const drawContext = getDrawContext();
  clearCanvas = () => drawContext.clearRect(0, 0, drawContext.canvas.height, drawContext.canvas.width);
} */

  // Create a single supabase client for interacting with your database
  const supabase = createClient(
    'https://pidxdsxphlhzjnzmifth.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
  );
  async function initCode() {
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

  const container = document.getElementById('code');
  const setFontSize = (size) => (container.style.fontSize = size + 'px');
  const setFontFamily = (family) => (container.style.fontFamily = family);

  /* const drawContext = getDrawContext()
const drawTime = [-2, 2]; */
  console.log('container', container);
  const editor = new StrudelMirror({
    theme: themes.strudelTheme,
    defaultOutput: webaudioOutput,
    getTime: () => getAudioContext().currentTime,
    transpiler,
    root: container,
    initialCode: '// LOADING',
    /* drawTime,
  onDraw: (haps, time) =>
    drawPianoroll({ haps, time, ctx: drawContext, drawTime, fold: 1 }),  */
    prebake: () => prebake(),
    afterEval: ({ code }) => {
      setLatestCode(code);
      window.location.hash = '#' + code2hash(code);
    },
  });

  function getRandomTune() {
    const allTunes = Object.entries(tunes);
    const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const [name, code] = randomItem(allTunes);
    return { name, code };
  }

  const { code: randomTune, name } = getRandomTune();

  function init() {
    if (!container) {
      console.warn('could not init: no container found');
      return;
    }
    const settings = settingsMap.get();
    setFontSize(settings.fontSize);
    setFontFamily(settings.fontFamily);
    initCode().then((decoded) => {
      let msg;
      if (decoded) {
        editor.setCode(decoded);
        msg = `I have loaded the code from the URL.`;
      } else if (latestCode) {
        editor.setCode(latestCode);
        msg = `Your last session has been loaded!`;
      } /*  if(randomTune) */ else {
        editor.setCode(randomTune);
        msg = `A random code snippet named "${name}" has been loaded!`;
      }
      console.log('msg', msg);
      /* logger(`Welcome to Strudel! ${msg} Press play or hit ctrl+enter to run it!`, 'highlight');
    setPending(false); */
    });

    editor.setTheme(themes[settings.theme || 'strudelTheme']);
  }
  init();

  settingsMap.listen((settings, key) => {
    const value = settings[key];
    if (key === 'theme') {
      editor.setTheme(themes[value]);
    } else if (key === 'fontFamily') {
      // console.log('change fontFamily', value);
      setFontFamily(value);
    } else if (key === 'fontSize') {
      // console.log('change fontSize', value);
      setFontSize(value);
    }
  });

  onEvent('strudel-toggle-play', () => {
    console.log('toggle-play');
    editor.evaluate();
  });

  // const isEmbedded = embedded || window.location !== window.parent.location;
}

let inited = false;
onEvent('strudel-container', () => {
  if (!inited) {
    inited = true;
    run();
  }
});
