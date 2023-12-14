import { Prec } from '@codemirror/state';
import { keymap, ViewPlugin } from '@codemirror/view';
// import { searchKeymap } from '@codemirror/search';
import { emacs } from '@replit/codemirror-emacs';
import { vim } from '@replit/codemirror-vim';
import { vscodeKeymap } from '@replit/codemirror-vscode-keymap';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';

const vscodePlugin = ViewPlugin.fromClass(
  class {
    constructor() {}
  },
  {
    provide: () => {
      return Prec.highest(keymap.of([...vscodeKeymap]));
    },
  },
);
const vscodeExtension = (options) => [vscodePlugin].concat(options ?? []);

const keymaps = {
  vim,
  emacs,
  vscode: vscodeExtension,
};

// filter out Mod-Enter to fix linux ctrl+enter
const _defaultKeymap = defaultKeymap.filter((kb) => kb.key !== 'Mod-Enter');

export function keybindings(name) {
  const active = keymaps[name];
  return [keymap.of(_defaultKeymap), keymap.of(historyKeymap), active ? active() : []];
  // keymap.of(searchKeymap),
}
