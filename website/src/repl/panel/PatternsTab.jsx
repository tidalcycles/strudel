import { DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useSettings } from '../../settings.mjs';
import {
  exportPatterns,
  importPatterns,
  useActivePattern,
  useViewingPatternData,
  userPattern,
} from '../../user_pattern_utils.mjs';
import { useMemo } from 'react';
import { getMetadata } from '../../metadata_parser';
import { useExamplePatterns } from '../useExamplePatterns';
import { parseJSON } from '../util.mjs';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function PatternLabel({ pattern } /* : { pattern: Tables<'code'> } */) {
  const meta = useMemo(() => getMetadata(pattern.code), [pattern]);

  return (
    <>{`${pattern.id}: ${
      meta.title ?? pattern.hash ?? new Date(pattern.created_at).toLocaleDateString() ?? 'unnamed'
    } by ${Array.isArray(meta.by) ? meta.by.join(',') : 'Anonymous'}`}</>
  );
}

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

function PatternButtons({ patterns, activePattern, onClick, started }) {
  const viewingPatternStore = useViewingPatternData();
  const viewingPatternData = parseJSON(viewingPatternStore);
  const viewingPatternID = viewingPatternData.id;
  return (
    <div className="font-mono text-sm">
      {Object.values(patterns)
        .reverse()
        .map((pattern) => {
          const id = pattern.id;
          return (
            <PatternButton
              pattern={pattern}
              key={id}
              showHiglight={id === viewingPatternID}
              showOutline={id === activePattern && started}
              onClick={() => onClick(id)}
            />
          );
        })}
    </div>
  );
}

function ActionButton({ children, onClick, label, labelIsHidden }) {
  return (
    <button className="hover:opacity-50" onClick={onClick} title={label}>
      {labelIsHidden !== true && label}
      {children}
    </button>
  );
}

export function PatternsTab({ context }) {
  const activePattern = useActivePattern();
  const viewingPatternStore = useViewingPatternData();
  const viewingPatternData = parseJSON(viewingPatternStore);

  const { userPatterns } = useSettings();
  const examplePatterns = useExamplePatterns();
  const collections = examplePatterns.collections;

  const updateCodeWindow = (patternData, reset = false) => {
    context.handleUpdate(patternData, reset);
  };
  const viewingPatternID = viewingPatternData?.id;
  const viewingIDIsValid = userPattern.isValidID(viewingPatternID);
  const isUserPattern = userPatterns[viewingPatternID] != null;

  return (
    <div className="px-4 w-full dark:text-white text-stone-900 space-y-4 pb-4">
      <section>
        {viewingIDIsValid && (
          <div className="flex items-center mb-2 space-x-2 overflow-auto">
            <h1 className="text-xl">{`${viewingPatternID}`}</h1>
            <div className="space-x-4 flex w-min">
              <ActionButton
                label="Duplicate"
                onClick={() => {
                  const { data } = userPattern.duplicate(viewingPatternData);
                  updateCodeWindow(data);
                }}
                labelIsHidden
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </ActionButton>
              {isUserPattern && (
                <ActionButton
                  label="Delete"
                  onClick={() => {
                    const { data } = userPattern.delete(viewingPatternID);
                    updateCodeWindow({ ...data, collection: userPattern.collection });
                  }}
                  labelIsHidden
                >
                  <TrashIcon className="w-5 h-5" />
                </ActionButton>
              )}
            </div>
          </div>
        )}
        <PatternButtons
          onClick={(id) => updateCodeWindow({ ...userPatterns[id], collection: userPattern.collection }, false)}
          patterns={userPatterns}
          started={context.started}
          activePattern={activePattern}
          viewingPatternID={viewingPatternID}
        />
        <div className="pr-4 space-x-4 border-b border-foreground mb-2 h-8 flex overflow-auto max-w-full items-center">
          <ActionButton
            label="new"
            onClick={() => {
              const { data } = userPattern.createAndAddToDB();
              updateCodeWindow(data);
            }}
          />
          <ActionButton
            label="clear"
            onClick={() => {
              const { data } = userPattern.clearAll();
              updateCodeWindow(data);
            }}
          />

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
          <ActionButton label="export" onClick={exportPatterns} />
        </div>
      </section>
      {Array.from(collections.keys()).map((collection) => {
        const patterns = collections.get(collection);
        return (
          <section key={collection}>
            <h2 className="text-xl mb-2">{collection}</h2>
            <div className="font-mono text-sm">
              <PatternButtons
                onClick={(id) => updateCodeWindow({ ...patterns[id], collection }, false)}
                started={context.started}
                patterns={patterns}
                activePattern={activePattern}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
