import { DocumentDuplicateIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';

import {

  $featuredPatterns,
  $publicPatterns,
  clearUserPatterns,
  deleteActivePattern,
  duplicateActivePattern,

  exportPatterns,
  importPatterns,
  useActivePattern,
  useViewingPattern,
  useSettings,
  userPattern,
  examplePattern,
} from '../../settings.mjs';

import { useMemo } from 'react';

import * as tunes from '../tunes.mjs';
import { useStore } from '@nanostores/react';
import { getMetadata } from '../../metadata_parser';


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

  const featuredPatterns = useStore($featuredPatterns);
  const publicPatterns = useStore($publicPatterns);
  const isExample = useMemo(() => activePattern && !!tunes[activePattern], [activePattern]);

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

        <h2 className="text-xl mb-2">Examples</h2>
        <PatternButtons
          onClick={(id) => onPatternBtnClick(id, true)}
          started={context.started}
          patterns={examplePatterns}
          activePattern={activePattern}
          viewingPattern={viewingPattern}
        />

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
