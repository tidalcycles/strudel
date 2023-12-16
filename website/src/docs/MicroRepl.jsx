import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from './Icon';
import '@strudel/repl';

// import { useInView } from 'react-hook-inview';

export function MicroRepl({ code, hideHeader = false }) {
  /* const [ref, isVisible] = useInView({
    threshold: 0.01,
  }); */
  const [replState, setReplState] = useState({});
  const { started, isDirty, error } = replState;
  const wc = useRef();
  function togglePlay() {
    if (wc.current) {
      wc.current?.editor.toggle();
    }
  }
  const listener = useCallback((e) => setReplState({ ...e.detail }), []);
  useEffect(() => {
    return () => {
      wc.current.removeEventListener('update', listener);
    };
  }, []);
  return (
    <div
      className="overflow-hidden rounded-t-md bg-background border border-lineHighlight"
      //ref={ref}
    >
      {!hideHeader && (
        <div className="flex justify-between bg-lineHighlight">
          <div className="flex">
            <button
              className={cx(
                'cursor-pointer w-16 flex items-center justify-center p-1 border-r border-lineHighlight text-foreground bg-lineHighlight hover:bg-background',
                started ? 'animate-pulse' : '',
              )}
              onClick={() => togglePlay()}
            >
              <Icon type={started ? 'stop' : 'play'} />
            </button>
            <button
              className={cx(
                'w-16 flex items-center justify-center p-1 text-foreground border-lineHighlight bg-lineHighlight',
                isDirty ? 'text-foreground hover:bg-background cursor-pointer' : 'opacity-50 cursor-not-allowed',
              )}
              onClick={() => activateCode()}
            >
              <Icon type="refresh" />
            </button>
          </div>
        </div>
      )}
      <div className="overflow-auto relative">
        <strudel-editor
          is-line-numbers-displayed="0"
          is-active-line-highlighted="0"
          code={code}
          ref={(el) => {
            if (wc.current) {
              return;
            }
            wc.current = el;
            el.addEventListener('update', listener);
          }}
        ></strudel-editor>
        {error && <div className="text-right p-1 text-md text-red-200">{error.message}</div>}
      </div>
      {/* punchcard && (
      <canvas
        id={canvasId}
        className="w-full pointer-events-none"
        height={canvasHeight}
        ref={(el) => {
          if (el && el.width !== el.clientWidth) {
            el.width = el.clientWidth;
          }
        }}
      ></canvas>
    ) */}
      {/* !!log.length && (
      <div className="bg-gray-800 rounded-md p-2">
        {log.map(({ message }, i) => (
          <div key={i}>{message}</div>
        ))}
      </div>
    ) */}
    </div>
  );
}

function cx(...classes) {
  // : Array<string | undefined>
  return classes.filter(Boolean).join(' ');
}
