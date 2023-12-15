import { getDrawContext, silence } from '@strudel.cycles/core';
import { transpiler } from '@strudel.cycles/transpiler';
import { getAudioContext, webaudioOutput } from '@strudel.cycles/webaudio';
import { StrudelMirror } from '@strudel/codemirror';
import { prebake } from './prebake.mjs';

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
  theme: 'strudelTheme',
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
class StrudelRepl extends HTMLElement {
  static observedAttributes = ['code', ...settingAttributes];
  settings = initialSettings;
  editor = null;
  constructor() {
    super();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'code') {
      this.code = newValue;
      this.editor?.setCode(newValue);
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
    this.editor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      root: this,
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
      prebake,
      afterEval: ({ code }) => {
        // window.location.hash = '#' + code2hash(code);
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

customElements.define('strudel-editor', StrudelRepl);
