import useEvent from '@src/useEvent.mjs';
import { useStore } from '@nanostores/react';
import { getAudioContext, soundMap, connectToDestination } from '@strudel/webaudio';
import React, { useMemo, useRef } from 'react';
import { settingsMap, useSettings } from '../../settings.mjs';
import { ButtonGroup } from './Forms.jsx';
import ImportSoundsButton from './ImportSoundsButton.jsx';

const getSamples = (samples) =>
  Array.isArray(samples) ? samples.length : typeof samples === 'object' ? Object.values(samples).length : 1;

export function SoundsTab() {
  const sounds = useStore(soundMap);
  console.log({ sounds, soundMap });
  const { soundsFilter } = useSettings();
  const soundEntries = useMemo(() => {
    let filtered = Object.entries(sounds).filter(([key]) => !key.startsWith('_'));
    if (!sounds) {
      return [];
    }
    if (soundsFilter === 'user') {
      return filtered.filter(([key, { data }]) => !data.prebake);
    }
    if (soundsFilter === 'drums') {
      return filtered.filter(([_, { data }]) => data.type === 'sample' && data.tag === 'drum-machines');
    }
    if (soundsFilter === 'samples') {
      return filtered.filter(([_, { data }]) => data.type === 'sample' && data.tag !== 'drum-machines');
    }
    if (soundsFilter === 'synths') {
      return filtered.filter(([_, { data }]) => ['synth', 'soundfont'].includes(data.type));
    }
    return filtered;
  }, [sounds, soundsFilter]);
  // holds mutable ref to current triggered sound
  const trigRef = useRef();
  // stop current sound on mouseup
  useEvent('mouseup', () => {
    const t = trigRef.current;
    trigRef.current = undefined;
    t?.then((ref) => {
      ref?.stop(getAudioContext().currentTime + 0.01);
    });
  });
  return (
    <div id="sounds-tab" className="px-4 flex flex-col w-full h-full dark:text-white text-stone-900">
      <div className="pb-2 flex shrink-0 overflow-auto">
        <ButtonGroup
          value={soundsFilter}
          onChange={(value) => settingsMap.setKey('soundsFilter', value)}
          items={{
            samples: 'samples',
            drums: 'drum-machines',
            synths: 'Synths',
            user: 'User',
          }}
        ></ButtonGroup>
        <ImportSoundsButton onComplete={() => settingsMap.setKey('soundsFilter', 'user')} />
      </div>
      <div className="min-h-0 max-h-full grow overflow-auto font-mono text-sm break-normal">
        {soundEntries.map(([name, { data, onTrigger }]) => {
          return (
            <span
              key={name}
              className="cursor-pointer hover:opacity-50"
              onMouseDown={async () => {
                const ctx = getAudioContext();
                const params = {
                  note: ['synth', 'soundfont'].includes(data.type) ? 'a3' : undefined,
                  s: name,
                  clip: 1,
                  release: 0.5,
                  sustain: 1,
                  duration: 0.5,
                };
                const time = ctx.currentTime + 0.05;
                const onended = () => trigRef.current?.node?.disconnect();
                trigRef.current = Promise.resolve(onTrigger(time, params, onended));
                trigRef.current.then((ref) => {
                  connectToDestination(ref?.node);
                });
              }}
            >
              {' '}
              {name}
              {data?.type === 'sample' ? `(${getSamples(data.samples)})` : ''}
              {data?.type === 'soundfont' ? `(${data.fonts.length})` : ''}
            </span>
          );
        })}
        {!soundEntries.length ? 'No custom sounds loaded in this pattern (yet).' : ''}
      </div>
    </div>
  );
}
