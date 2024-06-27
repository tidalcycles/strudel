import { code2hash } from '@strudel/core';

import { UdelFrame } from './UdelFrame';
import { useState } from 'react';
import UdelsHeader from './UdelsHeader';

const defaultHash = 'c3RhY2soCiAgCik%3D';

const getHashesFromUrl = () => {
  return window.location.hash?.slice(1).split(',');
};
const updateURLHashes = (hashes) => {
  const newHash = '#' + hashes.join(',');
  window.location.hash = newHash;
};
export function Udels() {
  const hashes = getHashesFromUrl();

  const [numWindows, setNumWindows] = useState(hashes?.length ?? 1);
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
        margin: 0,
        display: 'flex',
        flex: 1,
        height: '100vh',
        width: '100%',
        flexDirection: 'column',
      }}
    >
      <UdelsHeader numWindows={numWindows} setNumWindows={numWindowsOnChange} />
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
            <UdelFrame
              instance={key}
              onEvaluate={(code) => {
                onEvaluate(key, code);
              }}
              hash={hash}
              key={key}
            />
          );
        })}
      </div>
    </div>
  );
}
