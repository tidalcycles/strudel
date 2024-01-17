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

import { useStore } from '@nanostores/react';
import { getMetadata } from '../../metadata_parser';
import { useExamplePatterns } from '../useExamplePatterns';

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
  const activePattern = useActivePattern();
  const viewingPattern = useViewingPattern();
  const { userPatterns } = useSettings();
  const examplePatterns = useExamplePatterns();
  const collections = examplePatterns.collections;
  const examplesData = examplePatterns.patterns;

  const updateCodeWindow = (id, data, reset = false) => {
    context.handleUpdate(id, data, reset);
    // if (patternSource === userPattern.source) {

    // } else {
    //   const source = otherPatterns.get(patternSource);
    //   const data = source[id];
    // }
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
                    updateCodeWindow(id, { ...data, collection: userPattern.source });
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
          onClick={(id) => updateCodeWindow(id, { ...userPatterns[id], collection: userPattern.source }, false)}
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
      {Array.from(collections.keys()).map((collection) => {
        const patterns = collections.get(collection);

        return (
          <section key={collection}>
            <h2 className="text-xl mb-2">{collection}</h2>
            <div className="font-mono text-sm">
              <PatternButtons
                onClick={(id) => updateCodeWindow(id, { ...patterns[id], collection }, true)}
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
