import useEvent from '@src/useEvent.mjs';
import { useStore } from '@nanostores/react';
import { getAudioContext, soundMap, connectToDestination } from '@strudel/webaudio';
import { useMemo, useRef, useState } from 'react';
import { settingsMap, useSettings } from '../../../settings.mjs';
import { ButtonGroup } from './Forms.jsx';
import ImportSoundsButton from './ImportSoundsButton.jsx';
import { Textbox } from '../textbox/Textbox.jsx';

const getSamples = (samples) =>
  Array.isArray(samples) ? samples.length : typeof samples === 'object' ? Object.values(samples).length : 1;

export function SoundsTab() {
  const sounds = useStore(soundMap);
  const { soundsFilter } = useSettings();
  const [search, setSearch] = useState('');
  const { BASE_URL } = import.meta.env;
  const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

  const soundEntries = useMemo(() => {
    if (!sounds) {
      return [];
    }

    let filtered = Object.entries(sounds)
      .filter(([key]) => !key.startsWith('_'))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()));

    if (soundsFilter === 'user') {
      return filtered.filter(([_, { data }]) => !data.prebake);
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
    if (soundsFilter === 'importSounds') {
      return [];
    }
    return filtered;
  }, [sounds, soundsFilter, search]);

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
    <div id="sounds-tab" className="px-4 flex flex-col w-full h-full text-foreground">
      <Textbox placeholder="Search" value={search} onChange={(v) => setSearch(v)} />

      <div className="pb-2 flex shrink-0 flex-wrap">
        <ButtonGroup
          value={soundsFilter}
          onChange={(value) => settingsMap.setKey('soundsFilter', value)}
          items={{
            samples: 'samples',
            drums: 'drum-machines',
            synths: 'Synths',
            user: 'User',
            importSounds: 'import-sounds',
          }}
        ></ButtonGroup>
      </div>

      <div className="min-h-0 max-h-full grow overflow-auto  text-sm break-normal pb-2">
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
        {!soundEntries.length && soundsFilter === 'importSounds' ? (
          <div className="prose dark:prose-invert min-w-full pt-2 pb-8 px-4">
            <ImportSoundsButton onComplete={() => settingsMap.setKey('soundsFilter', 'user')} />
            <p>
              To import sounds into strudel, they must be contained{' '}
              <a href={`${baseNoTrailing}/learn/samples/#from-disk-via-import-sounds-folder`} target="_blank">
                within a folder or subfolder
              </a>
              . The best way to do this is to upload a “samples” folder containing subfolders of individual sounds or
              soundbanks (see diagram below).{' '}
            </p>
            <pre className="bg-background" key={'sample-diagram'}>
              {`└─ samples <-- import this folder
   ├─ swoop
   │  ├─ swoopshort.wav
   │  ├─ swooplong.wav
   │  └─ swooptight.wav
   └─ smash
      ├─ smashhigh.wav
      ├─ smashlow.wav
      └─ smashmiddle.wav`}
            </pre>
            <p>
              The name of a subfolder corresponds to the sound name under the “user” tab. Multiple samples within a
              subfolder are all labelled with the same name, but can be accessed using “.n( )” - remember sounds are
              zero-indexed and in alphabetical order!
            </p>
            <p>
              For more information, and other ways to use your own sounds in strudel,{' '}
              <a href={`${baseNoTrailing}/learn/samples/#from-disk-via-import-sounds-folder`} target="_blank">
                check out the docs
              </a>
              !
            </p>
            <h3>Preview Sounds</h3>
            <pre className="bg-background" key={'sample-preview'}>
              n("0 1 2 3 4 5").s("sample-name")
            </pre>
            <p>
              Paste the line above into the main editor to hear the uploaded folder. Remember to use the name of your
              sample as it appears under the "user" tab.
            </p>
          </div>
        ) : (
          ''
        )}
        {!soundEntries.length && soundsFilter !== 'importSounds'
          ? 'No custom sounds loaded in this pattern (yet).'
          : ''}
      </div>
    </div>
  );
}
