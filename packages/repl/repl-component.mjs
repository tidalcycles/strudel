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
if (typeof HTMLElement !== 'undefined') {
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
      // setTimeout makes sure the dom is ready
      setTimeout(() => {
        const code = (this.innerHTML + '').replace('<!--', '').replace('-->', '').trim();
        if (code) {
          // use comment code in element body if present
          this.setAttribute('code', code);
        }
      });
      // use a separate container for the editor, to make sure the innerHTML stays as is
      const container = document.createElement('div');
      this.parentElement.insertBefore(container, this.nextSibling);
      const drawContext = getDrawContext();
      const drawTime = [-2, 2];
      this.editor = new StrudelMirror({
        defaultOutput: webaudioOutput,
        getTime: () => getAudioContext().currentTime,
        transpiler,
        root: container,
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
        onUpdateState: (state) => {
          const event = new CustomEvent('update', {
            detail: state,
          });
          this.dispatchEvent(event);
        },
      });
      // init settings
      this.editor.updateSettings(this.settings);
      this.editor.setCode(this.code);
    }
    // Element functionality written in here
  }

  customElements.define('strudel-editor', StrudelRepl);
}
