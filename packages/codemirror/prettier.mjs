import { EditorSelection } from '@codemirror/state';
import * as prettier from 'prettier/standalone';
import typescriptPlugin from 'prettier/plugins/typescript';
import estreePlugin from 'prettier/plugins/estree';
import { keymap } from '@codemirror/view';

export async function runPrettier(editorView) {
  const currentState = editorView.state.doc.toString();
  // Prettier insists on consistent quotes, but in Strudel double quotes are interpreted
  // as patterns and single quotes are for everything else, so a consistent setting won't work.
  // It's a great formatter though, so as a workaround it works to put "// prettier-ignore" comments
  // before the single quoted stuff to preserve it, but this is a pain to make users to, so an extra
  // hack is to take the preformatted code, insert these comments behind the scenes, format, then
  // remove them before setting the editor state.
  const preFormat = currentState
    .split('\n')
    .map((line) => (line.match(/'.*'/) != null ? '// prettier-ignore\n' + line : line))
    .join('\n');
  console.log(preFormat);
  const formattedState = (
    await prettier.format(preFormat, {
      parser: 'typescript',
      plugins: [typescriptPlugin, estreePlugin],
      semi: false,
    })
  ).replace(/.*\/\/ prettier-ignore.*\n/g, '');

  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: formattedState },
    selection: EditorSelection.single(
      // keep cursor close to the original position, but also keep it within the bounds
      // of the formatted document
      Math.min(editorView.state.selection.main.to, formattedState.length),
    ),
    scrollIntoView: true,
  });
}

export const prettierPlugin = keymap.of([
  {
    key: 'Alt-,',
    preventDefault: true,
    run: runPrettier,
  },
  {
    key: 'Ctrl-,',
    preventDefault: true,
    run: runPrettier,
  },
  {
    key: 'Alt-Shift-f',
    preventDefault: true,
    run: runPrettier,
  },
]);
