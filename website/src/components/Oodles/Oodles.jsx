import { code2hash } from '@strudel.cycles/core';

import { Panel } from '@src/repl/panel/Panel';
import { StrudelFrame } from './StrudelFrame';
import { useState } from 'react';

function NumberInput({ value, onChange, label = '', min, max }) {
  return (
    <label>
      {label}
      <input
        min={min}
        max={max}
        className="p-2 bg-background rounded-md text-foreground"
        type={'number'}
        value={value ?? ''}
        onChange={(e) => {
          const val = e.target.value;

          onChange(val.length ? Math.min(parseFloat(e.target.value), max) : null);
        }}
      />
    </label>
  );
}
export function Oodles() {
  const [numWindows, setNumWindows] = useState(2);
  const codeMap = new Map();
  const onEvaluate = (key, code) => {
    codeMap.set(key, code);
    const hashes = [];
    codeMap.forEach((code, key) => {
      let hash = code2hash(code);
      hashes.push(hash);
    });
    const newHash = '#' + hashes.join(',');
    window.location.hash = newHash;
  };
  const hashes = window.location.hash?.slice(1).split(',');
  return (
    <div
      style={{
        backgroundColor: 'teal',
        margin: 0,
        display: 'flex',
        flex: 1,
        height: '100vh',
        width: '100%',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 40,
          width: '100',
          position: 'absolute',
          color: 'white',
          zIndex: 10,
        }}
      >
        <NumberInput min={1} max={8} value={numWindows} onChange={(val) => setNumWindows(val)} />
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {[...Array(Math.max(1, numWindows)).keys()].map((key) => {
          return (
            <StrudelFrame
              onEvaluate={(code) => {
                onEvaluate(key, code);
              }}
              hash={hashes[key]}
              key={key}
            />
          );
        })}
      </div>
      <Panel />
    </div>
  );
}
