import { DocumentDuplicateIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useMemo } from 'react';
import {
  $featuredPatterns,
  $publicPatterns,
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
import { useStore } from '@nanostores/react';
import { getMetadata } from '../../metadata_parser';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function PatternsTab({ context }) {
  const { userPatterns } = useSettings();
  const activePattern = useActivePattern();
  const featuredPatterns = useStore($featuredPatterns);
  const publicPatterns = useStore($publicPatterns);
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
      {featuredPatterns && (
        <section>
          <h2 className="text-xl mb-2">Featured Patterns</h2>
          <div className="font-mono text-sm">
            {featuredPatterns.map((pattern) => (
              <a
                key={pattern.id}
                className={classNames(
                  'mr-4 hover:opacity-50 cursor-pointer block',
                  pattern.hash === activePattern ? 'outline outline-1' : '',
                )}
                onClick={() => {
                  setActivePattern(pattern.hash);
                  context.handleUpdate(pattern.code, true);
                }}
              >
                <PatternLabel pattern={pattern} />
              </a>
            ))}
          </div>
        </section>
      )}
      {publicPatterns && (
        <section>
          <h2 className="text-xl mb-2">Last Creations</h2>
          <div className="font-mono text-sm">
            {publicPatterns.map((pattern) => (
              <a
                key={'public-' + pattern.id}
                className={classNames(
                  'mr-4 hover:opacity-50 cursor-pointer block', // inline-block
                  pattern.hash === activePattern ? 'outline outline-1' : '',
                )}
                onClick={() => {
                  setActivePattern(pattern.hash);
                  context.handleUpdate(pattern.code, true);
                }}
              >
                <PatternLabel pattern={pattern} />
              </a>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="text-xl mb-2">Stock Examples</h2>
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

export function PatternLabel({ pattern } /* : { pattern: Tables<'code'> } */) {
  const meta = useMemo(() => getMetadata(pattern.code), [pattern]);
  return (
    <>
      {pattern.id}. {meta.title || pattern.hash} by {Array.isArray(meta.by) ? meta.by.join(',') : 'Anonymous'}
    </>
  );
}
