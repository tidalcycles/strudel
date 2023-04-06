import { useState, useCallback } from 'react';
import { atomone } from '@uiw/codemirror-themes-all';
import { CodeMirror, flash, useKeydown } from '@strudel.cycles/react';
import { transpiler } from '@strudel.cycles/transpiler';
import Highlight from './Highlight';
import Stepper from './Stepper';
import escodegen from 'escodegen';

function getTranspiled(code) {
  return transpiler(code, {
    addReturn: false,
    codegenOptions: {
      format: escodegen.FORMAT_MINIFY,
    },
  });
}

function TranspilationEditor({ code: initialCode }) {
  const [code, setCode] = useState(initialCode);
  const [transpiled, setTranspiled] = useState(getTranspiled(initialCode));
  const [view, setView] = useState();
  useKeydown(
    useCallback(
      async (e) => {
        if (view?.hasFocus) {
          if (e.ctrlKey || e.altKey) {
            if (e.code === 'Enter') {
              /* if (getAudioContext().state !== 'running') {
              alert('please click play to initialize the audio. you can use shortcuts after that!');
              return;
            } */
              e.preventDefault();
              flash(view);
              const t = getTranspiled(code);
              setTranspiled(t);
              console.log('transpiled', t);
            } else if (e.key === '.') {
              stop();
              e.preventDefault();
            }
          }
        }
      },
      [code, view],
    ),
  );
  return (
    <div className="space-y-2 py-2">
      <CodeMirror
        value={code}
        onChange={(v) => {
          setCode(v);
        }}
        theme={atomone}
        onViewChanged={(v) => setView(v)}
        fontSize={32}
      />
      <span>⬇️ transpiles to</span>
      <Highlight language="javascript" code={transpiled} />
    </div>
  );
}

function TranspilationDemo() {
  return (
    <div className="not-prose space-y-8">
      <Stepper
        steps={[
          <>
            <ul className="list-decimal pl-8">
              <li>Enter JS Code</li>
              <li>Parse JS Code with acorn to get AST</li>
              <li>Modify AST with estree-walker</li>
              <li>Convert modified AST back to JS with escodegen</li>
            </ul>
          </>,
          <TranspilationEditor code={`"bd [hh sd]"`} />,
          <div className="space-y-2 py-2">
            <span>⬇️ calls</span>
            <Highlight
              code={`seq(
  reify('bd').withLocation([1,1,1], [1,4,4]),
  seq(
    reify('hh').withLocation([1,5,5], [1,8,8]),
    reify('sd').withLocation([1,8,8], [1,10,10]),
  )
).withMiniLocation([1,0,0],[1,12,12])`}
            />
            <span>➡️ location can be used for highlighting</span>
          </div>,
        ]}
      />
    </div>
  );
}

export default TranspilationDemo;
