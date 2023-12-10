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
  useSettings,
} from '../../settings.mjs';
import * as tunes from '../tunes.mjs';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function PatternsTab({ context }) {
  const { userPatterns, activePattern } = useSettings();
  const isExample = useMemo(() => activePattern && !!tunes[activePattern], [activePattern]);
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
        <div className="font-mono text-sm">
          {Object.entries(userPatterns).map(([key, up]) => (
            <a
              key={key}
              className={classNames(
                'mr-4 hover:opacity-50 cursor-pointer inline-block',
                key === activePattern ? 'outline outline-1' : '',
              )}
              onClick={() => {
                const { code } = up;
                setActivePattern(key);
                context.handleUpdate(code, true);
              }}
            >
              {key}
            </a>
          ))}
        </div>
        <div className="pr-4 space-x-4 border-b border-foreground mb-2 h-8 flex overflow-auto max-w-full items-center">
          <button
            className="hover:opacity-50"
            onClick={() => {
              const name = newUserPattern();
              const { code } = getUserPattern(name);
              context.handleUpdate(code, true);
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
        <div className="font-mono text-sm">
          {Object.entries(tunes).map(([key, tune]) => (
            <a
              key={key}
              className={classNames(
                'mr-4 hover:opacity-50 cursor-pointer inline-block',
                key === activePattern ? 'outline outline-1' : '',
              )}
              onClick={() => {
                setActivePattern(key);
                context.handleUpdate(tune, true);
              }}
            >
              {key}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
