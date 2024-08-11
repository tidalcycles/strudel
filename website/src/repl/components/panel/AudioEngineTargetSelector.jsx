import React from 'react';
import { audioEngineTargets } from '../../../settings.mjs';
import { SelectInput } from './SelectInput';

// Allows the user to select an audio interface for Strudel to play through
export function AudioEngineTargetSelector({ target, onChange, isDisabled }) {
  const onTargetChange = (target) => {
    onChange(target);
  };
  const options = new Map();
  Array.from(Object.keys(audioEngineTargets)).map((key) => {
    options.set(key, key);
  });

  return <SelectInput isDisabled={isDisabled} options={options} value={target} onChange={onTargetChange} />;
}
