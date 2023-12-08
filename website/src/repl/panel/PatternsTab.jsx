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
  addUserPattern,
} from '../../settings.mjs';
import { logger } from '@strudel.cycles/core';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function PatternsTab({ context }) {
  const { userPatterns, activePattern } = useSettings();
  return (
    <div className="px-4 w-full dark:text-white text-stone-900 space-y-4">
      <section>
        <h2 className="text-xl mb-2">Pattern Collection</h2>
        <div className="space-x-4 border-b border-foreground mb-2 pb-1">
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
          <label className="hover:opacity-50 cursor-pointer">
            <input
              style={{ display: 'none' }}
              type="file"
              multiple
              accept="text/plain"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                await Promise.all(
                  files.map(async (file, i) => {
                    const code = await file.text();
                    const name = file.name.replace(/\.[^/.]+$/, '');
                    console.log(i, name, code);
                    addUserPattern(name, { code });
                  }),
                );
                logger(`import done!`);
              }}
            />
            import
          </label>
        </div>
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
