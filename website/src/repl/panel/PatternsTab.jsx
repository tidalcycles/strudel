import { DocumentDuplicateIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';

import {
  clearUserPatterns,
  deletePattern,
  createDuplicatePattern,
  exportPatterns,
  addUserPattern,
  importPatterns,
  createNewUserPattern,
  renamePattern,
  useActivePattern,
  useViewingPattern,
  useSettings,
} from '../../settings.mjs';
import * as tunes from '../tunes.mjs';

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

function PatternButtons({ patterns, activePattern, onClick, viewingPattern }) {
  return (
    <div className="font-mono text-sm">
      {Object.entries(patterns).map(([key, data]) => (
        <PatternButton
          key={key}
          label={key}
          showHiglight={key === viewingPattern}
          showOutline={key === activePattern}
          onClick={() => onClick(key, data)}
        />
      ))}
    </div>
  );
}

export function PatternsTab({ context }) {
  const { userPatterns } = useSettings();
  const activePattern = useActivePattern();
  const viewingPattern = useViewingPattern();
  const onPatternClick = (pattern, data) => {
    // display selected pattern code in the window
    context.handleUpdate({ pattern, code: data.code, evaluate: false });
  };

  const addPattern = ({ pattern, code }) => {
    addUserPattern(pattern, { code });
    context.handleUpdate({ code, pattern, evaluate: false });
  };

  const examplePatterns = {};
  Object.entries(tunes).forEach(([key, code]) => (examplePatterns[key] = { code }));
  const isExample = examplePatterns[viewingPattern] != null;
  return (
    <div className="px-4 w-full dark:text-white text-stone-900 space-y-4 pb-4">
      <section>
        {viewingPattern && (
          <div className="flex items-center mb-2 space-x-2 overflow-auto">
            <h1 className="text-xl">{viewingPattern}</h1>
            <div className="space-x-4 flex w-min">
              {!isExample && (
                <button className="hover:opacity-50" onClick={() => renamePattern(viewingPattern)} title="Rename">
                  <PencilSquareIcon className="w-5 h-5" />
                  {/* <PencilIcon className="w-5 h-5" /> */}
                </button>
              )}
              <button
                className="hover:opacity-50"
                onClick={() => addPattern(createDuplicatePattern(viewingPattern))}
                title="Duplicate"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </button>
              {!isExample && (
                <button
                  className="hover:opacity-50"
                  onClick={() => {
                    const { code, pattern } = deletePattern(viewingPattern);
                    context.handleUpdate({ code, pattern, evaluate: false });
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
          onClick={onPatternClick}
          patterns={userPatterns}
          activePattern={activePattern}
          viewingPattern={viewingPattern}
        />
        <div className="pr-4 space-x-4 border-b border-foreground mb-2 h-8 flex overflow-auto max-w-full items-center">
          <button
            className="hover:opacity-50"
            onClick={() => {
              addPattern(createNewUserPattern());
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
        <PatternButtons
          onClick={onPatternClick}
          patterns={examplePatterns}
          activePattern={activePattern}
          viewingPattern={viewingPattern}
        />
      </section>
    </div>
  );
}
