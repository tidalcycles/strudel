import { getDrawContext, silence, controls, evalScope, hash2code, code2hash } from '@strudel.cycles/core';
import { StrudelMirror } from '@strudel/codemirror';
import { transpiler } from '@strudel.cycles/transpiler';
import { registerSoundfonts } from '@strudel.cycles/soundfonts';
import {
  getAudioContext,
  webaudioOutput,
  registerSynthSounds,
  registerZZFXSounds,
  samples,
} from '@strudel.cycles/webaudio';

function camelToKebab(camelCaseString) {
  return camelCaseString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
function kebabToCamel(kebabCaseString) {
  return kebabCaseString.replace(/-([a-z])/g, function (match, group) {
    return group.toUpperCase();
  });
}

const initialSettings = {
  keybindings: 'strudelTheme',
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
const settingAttributes = Object.keys(initialSettings).map(camelToKebab);
const parseAttribute = (name, value) => {
  const camel = kebabToCamel(name);
  const type = typeof initialSettings[camel];
  // console.log('type', type, name);
  if (type === 'boolean') {
    return ['1', 'true'].includes(value);
  }
  if (type === 'number') {
    return Number(value);
  }
  return value;
};
// console.log('attributes', settingAttributes);

class StrudelEditor extends HTMLElement {
  static observedAttributes = ['code', ...settingAttributes];
  settings = initialSettings;
  constructor() {
    super();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'code') {
      this.code = newValue;
      this.editor?.setCode(initialCode);
    } else if (settingAttributes.includes(name)) {
      const camel = kebabToCamel(name);
      this.settings[camel] = parseAttribute(name, newValue);
      // console.log('name', name, newValue, camel, this.settings[camel]);
      this.editor?.updateSettings(this.settings);
    }
  }
  connectedCallback() {
    const drawContext = getDrawContext();
    const drawTime = [-2, 2];
    this.container = document.createElement('div');
    this.appendChild(this.container);
    this.editor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      root: this.container,
      initialCode: '// LOADING',
      pattern: silence,
      settings: this.settings,
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
          import('@strudel.cycles/webaudio'),
          import('@strudel/codemirror'),
          import('@strudel/hydra'),
          import('@strudel.cycles/soundfonts'),
          // import('@strudel.cycles/xen'),
          // import('@strudel.cycles/serial'),
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
          registerSoundfonts(),
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
    this.editor.updateSettings(this.settings);
    this.editor.setCode(this.code);
    // settingsMap.listen((settings, key) => editor.changeSetting(key, settings[key]));
    // onEvent('strudel-toggle-play', () => this.editor.toggle());
  }
  // Element functionality written in here
}

customElements.define('strudel-editor', StrudelEditor);
