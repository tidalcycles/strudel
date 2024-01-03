import { DocumentDuplicateIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useMemo } from 'react';
import {
  clearUserPatterns,
  deleteActivePattern,
  duplicateActivePattern,
  exportPatterns,
  getUserPattern,
  importPatterns,
  newUserPattern,
  renameActivePattern,
  setActivePattern,
  useActivePattern,
  useSettings,
} from '../../settings.mjs';
import * as tunes from '../tunes.mjs';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function PatternButton({ isActive, onClick, label }) {
  return (
    <a
      className={classNames('mr-4 hover:opacity-50 cursor-pointer inline-block', isActive ? 'outline outline-1' : '')}
      onClick={onClick}
    >
      {label}
    </a>
  );
}

function PatternButtons({ patterns, activePattern, onClick }) {
  return (
    <div className="font-mono text-sm">
      {Object.entries(patterns).map(([key, data]) => (
        <PatternButton key={key} label={key} isActive={key === activePattern} onClick={() => onClick(key, data)} />
      ))}
    </div>
  );
}

export function PatternsTab({ context }) {
  const { userPatterns } = useSettings();
  const activePattern = useActivePattern();
  const isExample = useMemo(() => activePattern && !!tunes[activePattern], [activePattern]);
  const onPatternClick = (key, data) => {
    const { code } = data;
    setActivePattern(key);
    context.handleUpdate({ code, evaluate: false });
  };

  const examplePatterns = {};
  Object.entries(tunes).forEach(([key, code]) => (examplePatterns[key] = { code }));

  return (
    <div className="px-4 w-full dark:text-white text-stone-900 space-y-4 pb-4">
      <section>
        {activePattern && (
          <div className="flex items-center mb-2 space-x-2 overflow-auto">
            <h1 className="text-xl">{activePattern}</h1>
            <div className="space-x-4 flex w-min">
              {!isExample && (
                <button className="hover:opacity-50" onClick={() => renameActivePattern()} title="Rename">
                  <PencilSquareIcon className="w-5 h-5" />
                  {/* <PencilIcon className="w-5 h-5" /> */}
                </button>
              )}
              <button className="hover:opacity-50" onClick={() => duplicateActivePattern()} title="Duplicate">
                <DocumentDuplicateIcon className="w-5 h-5" />
              </button>
              {!isExample && (
                <button className="hover:opacity-50" onClick={() => deleteActivePattern()} title="Delete">
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}
        <PatternButtons onClick={onPatternClick} patterns={userPatterns} activePattern={activePattern} />
        <div className="pr-4 space-x-4 border-b border-foreground mb-2 h-8 flex overflow-auto max-w-full items-center">
          <button
            className="hover:opacity-50"
            onClick={() => {
              const name = newUserPattern();
              const { code } = getUserPattern(name);
              context.handleUpdate({ code, evaluate: false });
            }}
          >
            new
          </button>
          <button className="hover:opacity-50" onClick={() => clearUserPatterns()}>
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
        <PatternButtons onClick={onPatternClick} patterns={examplePatterns} activePattern={activePattern} />
      </section>
    </div>
  );
}
