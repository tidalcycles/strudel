import { code2hash } from '@strudel.cycles/core';

import { Panel } from '@src/repl/panel/Panel';
import { StrudelFrame } from './StrudelFrame';
import { useState } from 'react';

function NumberInput({ value, onChange, label = '', min, max }) {
  const [localState, setLocalState] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <label>
      {label}
      <input
        min={min}
        max={max}
        className="p-2 bg-background rounded-md text-foreground"
        type={'number'}
        value={(isFocused ? localState : value) ?? ''}
        onFocus={() => {
          setLocalState(value);
          setIsFocused(true);
        }}
        onBlur={() => {
          onChange(Math.max(localState, min));
          setIsFocused(false);
        }}
        onChange={(e) => {
          let val = e.target.value;
          val = val.length ? Math.min(parseFloat(e.target.value), max) : null;
          setLocalState(val);
        }}
      />
    </label>
  );
}
const defaultHash = 'c3RhY2soCiAgCik%3D';

const getHashesFromUrl = () => {
  return window.location.hash?.slice(1).split(',');
};
const updateURLHashes = (hashes) => {
  const newHash = '#' + hashes.join(',');
  window.location.hash = newHash;
};
export function Oodles() {
  const hashes = getHashesFromUrl();

  const [numWindows, setNumWindows] = useState(hashes.length);
  const numWindowsOnChange = (num) => {
    setNumWindows(num);
    const hashes = getHashesFromUrl();
    const newHashes = [];
    for (let i = 0; i < num; i++) {
      newHashes[i] = hashes[i] ?? defaultHash;
    }
    updateURLHashes(newHashes);
  };

  const onEvaluate = (key, code) => {
    const hashes = getHashesFromUrl();
    hashes[key] = code2hash(code);
    updateURLHashes(hashes);
  };

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
        <NumberInput min={1} max={8} value={numWindows} onChange={numWindowsOnChange} />
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {hashes.map((hash, key) => {
          return (
            <StrudelFrame
              onEvaluate={(code) => {
                onEvaluate(key, code);
              }}
              hash={hash}
              key={key}
            />
          );
        })}
      </div>
      <Panel />
    </div>
  );
}
