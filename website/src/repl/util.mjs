import { evalScope, hash2code, logger } from '@strudel/core';
import { settingPatterns } from '../settings.mjs';
import { setVersionDefaults } from '@strudel/webaudio';
import { getMetadata } from '../metadata_parser';
import { isTauri } from '../tauri.mjs';
import './Repl.css';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { $featuredPatterns /* , loadDBPatterns */ } from '@src/user_pattern_utils.mjs';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
);

let dbLoaded;
/* if (typeof window !== 'undefined') {
  dbLoaded = loadDBPatterns();
} */

export async function initCode() {
  // load code from url hash (either short hash from database or decode long hash)
  try {
    const initialUrl = window.location.href;
    const hash = initialUrl.split('?')[1]?.split('#')?.[0]?.split('&')[0];
    const codeParam = window.location.href.split('#')[1] || '';
    if (codeParam) {
      // looking like https://strudel.cc/#ImMzIGUzIg%3D%3D (hash length depends on code length)
      return hash2code(codeParam);
    } else if (hash) {
      // looking like https://strudel.cc/?J01s5i1J0200 (fixed hash length)
      return supabase
        .from('code_v1')
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

export const parseJSON = (json) => {
  json = json != null && json.length ? json : '{}';
  try {
    return JSON.parse(json);
  } catch {
    return '{}';
  }
};

export async function getRandomTune() {
  await dbLoaded;
  const featuredTunes = Object.entries($featuredPatterns.get());
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const [_, data] = randomItem(featuredTunes);
  return data;
}

export function loadModules() {
  let modules = [
    import('@strudel/core'),
    import('@strudel/draw'),
    import('@strudel/tonal'),
    import('@strudel/mini'),
    import('@strudel/xen'),
    import('@strudel/webaudio'),
    import('@strudel/codemirror'),
    import('@strudel/hydra'),
    import('@strudel/serial'),
    import('@strudel/shader'),
    import('@strudel/soundfonts'),
    import('@strudel/csound'),
    import('@strudel/tidal'),
    import('@strudel/gamepad'),
    import('@strudel/motion'),
    import('@strudel/mqtt'),
  ];
  if (isTauri()) {
    modules = modules.concat([
      import('@strudel/desktopbridge/loggerbridge.mjs'),
      import('@strudel/desktopbridge/midibridge.mjs'),
      import('@strudel/desktopbridge/oscbridge.mjs'),
    ]);
  } else {
    modules = modules.concat([import('@strudel/midi'), import('@strudel/osc')]);
  }

  return evalScope(settingPatterns, ...modules);
}
// confirm dialog is a promise in webkit and a boolean in other browsers... normalize it to be a promise everywhere
export function confirmDialog(msg) {
  const confirmed = confirm(msg);
  if (confirmed instanceof Promise) {
    return confirmed;
  }
  return new Promise((resolve) => {
    resolve(confirmed);
  });
}

let lastShared;

//RIP due to SPAM
// export async function shareCode(codeToShare) {
//   // const codeToShare = activeCode || code;
//   if (lastShared === codeToShare) {
//     logger(`Link already generated!`, 'error');
//     return;
//   }

//   confirmDialog(
//     'Do you want your pattern to be public? If no, press cancel and you will get just a private link.',
//   ).then(async (isPublic) => {
//     const hash = nanoid(12);
//     const shareUrl = window.location.origin + window.location.pathname + '?' + hash;
//     const { error } = await supabase.from('code_v1').insert([{ code: codeToShare, hash, ['public']: isPublic }]);
//     if (!error) {
//       lastShared = codeToShare;
//       // copy shareUrl to clipboard
//       if (isTauri()) {
//         await writeText(shareUrl);
//       } else {
//         await navigator.clipboard.writeText(shareUrl);
//       }
//       const message = `Link copied to clipboard: ${shareUrl}`;
//       alert(message);
//       // alert(message);
//       logger(message, 'highlight');
//     } else {
//       console.log('error', error);
//       const message = `Error: ${error.message}`;
//       // alert(message);
//       logger(message);
//     }
//   });
// }

export async function shareCode() {
  try {
    const shareUrl = window.location.href;
    if (isTauri()) {
      await writeText(shareUrl);
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
    const message = `Link copied to clipboard!`;
    alert(message);
    logger(message, 'highlight');
  } catch (e) {
    console.error(e);
  }
}

export const isIframe = () => window.location !== window.parent.location;
function isCrossOriginFrame() {
  try {
    return !window.top.location.hostname;
  } catch (e) {
    return true;
  }
}

export const isUdels = () => {
  if (isCrossOriginFrame()) {
    return false;
  }
  return window.top?.location?.pathname.includes('udels');
};

export function setVersionDefaultsFrom(code) {
  try {
    const metadata = getMetadata(code);
    setVersionDefaults(metadata.version);
  } catch (err) {
    console.error('Error parsing metadata..');
    console.error(err);
  }
}
