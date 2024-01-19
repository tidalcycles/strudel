import { DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useSettings } from '../../settings.mjs';
import {
  exportPatterns,
  importPatterns,
  useActivePattern,
  useViewingPattern,
  userPattern,
} from '../../user_pattern_utils.mjs';
import { useMemo } from 'react';
import { getMetadata } from '../../metadata_parser';
import { useExamplePatterns } from '../useExamplePatterns';

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
  const viewingPattern = useViewingPattern();
  const { userPatterns } = useSettings();
  const examplePatterns = useExamplePatterns();
  const collections = examplePatterns.collections;

  const updateCodeWindow = (id, data, reset = false) => {
    context.handleUpdate(id, data, reset);
  };
  const isUserPattern = userPatterns[viewingPattern] != null;

  return (
    <div className="px-4 w-full dark:text-white text-stone-900 space-y-4 pb-4">
      <section>
        {viewingPattern && (
          <div className="flex items-center mb-2 space-x-2 overflow-auto">
            <h1 className="text-xl">{`${viewingPattern}`}</h1>
            <div className="space-x-4 flex w-min">
              <ActionButton
                label="Duplicate"
                onClick={() => {
                  const { id, data } = userPattern.duplicate(
                    userPattern.getPatternData(id) ?? examplePatterns.patterns[id],
                  );
                  updateCodeWindow(id, data);
                }}
                labelIsHidden
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
              </ActionButton>
              {isUserPattern && (
                <ActionButton
                  label="Delete"
                  onClick={() => {
                    const { id, data } = userPattern.delete(viewingPattern);
                    updateCodeWindow(id, { ...data, collection: userPattern.collection });
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
          onClick={(id) => updateCodeWindow(id, { ...userPatterns[id], collection: userPattern.collection }, false)}
          patterns={userPatterns}
          started={context.started}
          activePattern={activePattern}
          viewingPattern={viewingPattern}
        />
        <div className="pr-4 space-x-4 border-b border-foreground mb-2 h-8 flex overflow-auto max-w-full items-center">
          <ActionButton
            label="new"
            onClick={() => {
              const { id, data } = userPattern.createAndAddToDB();
              updateCodeWindow(id, data);
            }}
          />
          <ActionButton
            label="clear"
            onClick={() => {
              const { id, data } = userPattern.clearAll();
              updateCodeWindow(id, data);
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
