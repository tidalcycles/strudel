import { cx } from '@strudel.cycles/react';
import React from 'react';
import * as tunes from '../tunes.mjs';

export function PatternsTab({ context }) {
  return (
    <div className="px-4 w-full">
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
