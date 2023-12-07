import { cx } from '@strudel.cycles/react';
import React from 'react';

export function ButtonGroup({ value, onChange, items }) {
  return (
    <div className="flex max-w-lg">
      {Object.entries(items).map(([key, label], i, arr) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cx(
            'px-2 border-b h-8',
            // i === 0 && 'rounded-l-md',
            // i === arr.length - 1 && 'rounded-r-md',
            // value === key ? 'bg-background' : 'bg-lineHighlight',
            value === key ? 'border-foreground' : 'border-transparent',
          )}
        >
          {label.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
