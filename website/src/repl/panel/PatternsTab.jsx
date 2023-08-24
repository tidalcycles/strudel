import React from 'react';
import * as tunes from '../tunes.mjs';
import { useSettings, clearUserPatterns, newUserPattern } from '../../settings.mjs';

export function PatternsTab({ context }) {
  const { userPatterns } = useSettings();
  return (
    <div className="px-4 w-full text-foreground">
      <h2 className="text-xl mb-2">My Patterns</h2>
      <div className="space-x-1">
        <button onClick={() => newUserPattern()}>add user pattern</button>
        <button onClick={() => clearUserPatterns()}>clear user patterns</button>
      </div>
      {Object.entries(userPatterns).map(([key, up]) => (
        <a
          key={key}
          className="mr-4 hover:opacity-50 cursor-pointer inline-block"
          onClick={() => {
            const { code } = up;
            console.log('clikkk', code);
            context.handleUpdate(code);
          }}
        >
          {key}
        </a>
      ))}
      <h2 className="text-xl mb-2">Examples</h2>
      {Object.entries(tunes).map(([key, tune]) => (
        <a
          key={key}
          className="mr-4 hover:opacity-50 cursor-pointer inline-block"
          onClick={() => {
            console.log('clikkk', tune);
            context.handleUpdate(tune);
          }}
        >
          {key}
        </a>
      ))}
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
