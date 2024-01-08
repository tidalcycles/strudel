import { DocumentDuplicateIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';

import {
  exportPatterns,
  importPatterns,
  useActivePattern,
  useViewingPattern,
  useSettings,
  userPattern,
  examplePattern,
} from '../../settings.mjs';
import { useMemo } from 'react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function PatternButton({ showOutline, onClick, label, showHiglight }) {
  return (
    <a
      className={classNames(
        'mr-4 hover:opacity-50 cursor-pointer inline-block',
        showOutline && 'outline outline-1',
        showHiglight && 'bg-selection',
      )}
      onClick={onClick}
    >
      {label}
    </a>
  );
}

function PatternButtons({ patterns, activePattern, onClick, viewingPattern, started }) {
  return (
    <div className="font-mono text-sm">
      {Object.entries(patterns).map(([id]) => (
        <PatternButton
          key={id}
          label={id}
          showHiglight={id === viewingPattern}
          showOutline={id === activePattern && started}
          onClick={() => onClick(id)}
        />
      ))}
    </div>
  );
}

export function PatternsTab({ context }) {
  const { userPatterns } = useSettings();
  const examplePatterns = useMemo(() => examplePattern.getAll(), []);
  const activePattern = useActivePattern();
  const viewingPattern = useViewingPattern();
  const updateCodeWindow = (id, code, reset = false) => {
    context.handleUpdate(id, code, reset);
  };
  const onPatternBtnClick = (id, isExample = false) => {
    const code = isExample ? examplePatterns[id].code : userPatterns[id].code;

    // display selected pattern code in the window
    updateCodeWindow(id, code, isExample);
  };

  const isExample = examplePatterns[viewingPattern] != null;
  return (
    <div className="px-4 w-full dark:text-white text-stone-900 space-y-4 pb-4">
      <section>
        {viewingPattern && (
          <div className="flex items-center mb-2 space-x-2 overflow-auto">
            <h1 className="text-xl">{viewingPattern}</h1>
            <div className="space-x-4 flex w-min">
              {!isExample && (
                <button
                  className="hover:opacity-50"
                  onClick={() => {
                    const { id, data } = userPattern.rename(viewingPattern);
                    updateCodeWindow(id, data.code);
                  }}
                  title="Rename"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
              )}
              <button
                className="hover:opacity-50"
                onClick={() => {
                  const { id, data } = userPattern.duplicate(viewingPattern);
                  updateCodeWindow(id, data.code);
                }}
                title="Duplicate"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </button>
              {!isExample && (
                <button
                  className="hover:opacity-50"
                  onClick={() => {
                    const { id, data } = userPattern.delete(viewingPattern);
                    updateCodeWindow(id, data.code);
                  }}
                  title="Delete"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
        <PatternButtons
          onClick={onPatternBtnClick}
          patterns={userPatterns}
          started={context.started}
          activePattern={activePattern}
          viewingPattern={viewingPattern}
        />
        <div className="pr-4 space-x-4 border-b border-foreground mb-2 h-8 flex overflow-auto max-w-full items-center">
          <button
            className="hover:opacity-50"
            onClick={() => {
              const { id, data } = userPattern.create();
              updateCodeWindow(id, data.code);
            }}
          >
            new
          </button>
          <button
            className="hover:opacity-50"
            onClick={() => {
              const { id, data } = userPattern.clearAll();
              updateCodeWindow(id, data.code);
            }}
          >
            clear
          </button>
          <label className="hover:opacity-50 cursor-pointer">
            <input
              style={{ display: 'none' }}
              type="file"
              multiple
              accept="text/plain,application/json"
              onChange={(e) => importPatterns(e.target.files)}
            />
            import
          </label>
          <button className="hover:opacity-50" onClick={() => exportPatterns()}>
            export
          </button>
        </div>
      </section>
      <section>
        <h2 className="text-xl mb-2">Examples</h2>
        <PatternButtons
          onClick={(id) => onPatternBtnClick(id, true)}
          started={context.started}
          patterns={examplePatterns}
          activePattern={activePattern}
          viewingPattern={viewingPattern}
        />
      </section>
    </div>
  );
}
