import React from 'react';
import { audioEngineTargets } from '../../../settings.mjs';
import { SelectInput } from './SelectInput';

// Allows the user to select an audio interface for Strudel to play through
export function AudioEngineTargetSelector({ target, onChange, isDisabled }) {
  const onTargetChange = (target) => {
    onChange(target);
  };
  const options = new Map([
    [audioEngineTargets.webaudio, audioEngineTargets.webaudio ],
    [audioEngineTargets.superdirt, 'superdirt (osc)'],
  ]);
  return <SelectInput isDisabled={isDisabled} options={options} value={target} onChange={onTargetChange} />;
}
