import { DocumentDuplicateIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/20/solid';

import {
  $featuredPatterns,
  $publicPatterns,
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

function PatternLabel({ pattern } /* : { pattern: Tables<'code'> } */) {
  const meta = useMemo(() => getMetadata(pattern.code), [pattern]);
  return (
    <>{`${pattern.id}: ${meta.title ?? pattern.hash ?? 'unnamed'} by ${
      Array.isArray(meta.by) ? meta.by.join(',') : 'Anonymous'
    }`}</>
  );
}

const getPatternLabel = (pattern) => {
  return `${pattern.id}: ${meta.title ?? pattern.hash ?? 'unnamed'} by ${
    Array.isArray(meta.by) ? meta.by.join(',') : 'Anonymous'
  }`;
};

function PatternButton({ showOutline, onClick, pattern, showHiglight }) {
  return (
    <a
      className={classNames(
        'mr-4 hover:opacity-50 cursor-pointer block',
        showOutline && 'outline outline-1',
        showHiglight && 'bg-selection',
      )}
      onClick={onClick}
    >
      <PatternLabel pattern={pattern} />
    </a>
  );
}

// function ListButton() {
//   return (
//     <a
//       key={pattern.id}
//       className={classNames(
//         'mr-4 hover:opacity-50 cursor-pointer block',
//         pattern.hash === activePattern ? 'outline outline-1' : '',
//       )}
//       onClick={() => {
//         setActivePattern(pattern.hash);
//         context.handleUpdate(pattern.code, true);
//       }}
//     >
//       <PatternLabel pattern={pattern} />
//     </a>
//   );
// }

function PatternButtons({ patterns, activePattern, onClick, viewingPattern, started }) {
  return (
    <div className="font-mono text-sm">
      {Object.values(patterns).map((pattern) => {
        const id = pattern.id;
        return (
          <PatternButton
            pattern={pattern}
            key={id}
            showHiglight={id === viewingPattern}
            showOutline={id === activePattern && started}
            onClick={() => onClick(id)}
          />
        );
      })}
    </div>
  );
}

export function PatternsTab({ context }) {
  const { userPatterns } = useSettings();
  const activePattern = useActivePattern();

  const featuredPatterns = useStore($featuredPatterns);
  const publicPatterns = useStore($publicPatterns);

  // const otherPatterns = [
  //   {source: 'Stock Examples', patterns: examplePatterns }
  // ]

  const otherPatterns = useMemo(() => {
    const pats = new Map();
    pats.set('Featured', featuredPatterns);
    pats.set('Last Creations', publicPatterns);
    pats.set('Stock Examples', examplePattern.getAll());
    return pats;
  }, [featuredPatterns, publicPatterns]);

  const viewingPattern = useViewingPattern();
  const updateCodeWindow = (id, code, reset = false) => {
    context.handleUpdate(id, code, reset);
  };

  const isUserPattern = userPatterns[viewingPattern] != null;

  // const isExample = useMemo(() => activePattern && !!tunes[activePattern], [activePattern]);

  return (
    <div className="px-4 w-full dark:text-white text-stone-900 space-y-4 pb-4">
      <section>
        {viewingPattern && (
          <div className="flex items-center mb-2 space-x-2 overflow-auto">
            <h1 className="text-xl">{`${viewingPattern}`}</h1>
            <div className="space-x-4 flex w-min">
              {/* {!isExample && (
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
              )} */}
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
              {isUserPattern && (
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
          onClick={(id) => updateCodeWindow(id, userPatterns[id]?.code, false)}
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
      {Array.from(otherPatterns.keys()).map((key) => {
        const patterns = otherPatterns.get(key);

        return (
          <section key={key}>
            <h2 className="text-xl mb-2">{key}</h2>
            <div className="font-mono text-sm">
              <PatternButtons
                onClick={(id) => updateCodeWindow(id, patterns[id]?.code, true)}
                started={context.started}
                patterns={patterns}
                activePattern={activePattern}
                viewingPattern={viewingPattern}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
