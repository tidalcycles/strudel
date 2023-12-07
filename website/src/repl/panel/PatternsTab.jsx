import React from 'react';
import * as tunes from '../tunes.mjs';
import {
  useSettings,
  clearUserPatterns,
  newUserPattern,
  setActivePattern,
  deleteActivePattern,
  duplicateActivePattern,
  getUserPattern,
  renameActivePattern,
} from '../../settings.mjs';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function PatternsTab({ context }) {
  const { userPatterns, activePattern } = useSettings();
  return (
    <div className="px-4 w-full text-foreground space-y-4">
      <section>
        <h2 className="text-xl mb-2">Pattern Collection</h2>
        <div className="space-x-4 border-b border-foreground mb-1">
          <button
            className="hover:opacity-50"
            onClick={() => {
              const name = newUserPattern();
              const { code } = getUserPattern(name);
              context.handleUpdate(code);
            }}
          >
            new
          </button>
          <button className="hover:opacity-50" onClick={() => duplicateActivePattern()}>
            duplicate
          </button>
          <button className="hover:opacity-50" onClick={() => renameActivePattern()}>
            rename
          </button>
          <button className="hover:opacity-50" onClick={() => deleteActivePattern()}>
            delete
          </button>
          <button className="hover:opacity-50" onClick={() => clearUserPatterns()}>
            clear
          </button>
        </div>
        {Object.entries(userPatterns).map(([key, up]) => (
          <a
            key={key}
            className={classNames(
              'mr-4 hover:opacity-50 cursor-pointer inline-block',
              key === activePattern ? 'underline' : '',
            )}
            onClick={() => {
              const { code } = up;
              setActivePattern(key);
              context.handleUpdate(code);
            }}
          >
            {key}
          </a>
        ))}
      </section>
      <section>
        <h2 className="text-xl mb-2">Examples</h2>
        {Object.entries(tunes).map(([key, tune]) => (
          <a
            key={key}
            className={classNames(
              'mr-4 hover:opacity-50 cursor-pointer inline-block',
              key === activePattern ? 'underline' : '',
            )}
            onClick={() => {
              setActivePattern(key);
              context.handleUpdate(tune);
            }}
          >
            {key}
          </a>
        ))}
      </section>
    </div>
  );
}

/*
selectable examples
if example selected
  type character -> create new user pattern with exampleName_n
  even if 
clicking (+) opens the "new" example with same behavior as above
*/
