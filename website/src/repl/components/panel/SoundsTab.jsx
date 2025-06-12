// A small UI update to improve the "Sounds" section
// — better organization with folder grouping, the ability to star ⭐ favorite sounds,
// and a slightly cleaner interface. Next step: making it easier to preview individual sounds within folders,
// since right now you only see the total count without an easy way to listen to them one by one.

import useEvent from '@src/useEvent.mjs';
import { useStore } from '@nanostores/react';
import { getAudioContext, soundMap, connectToDestination } from '@strudel/webaudio';
import { useMemo, useRef, useState, useEffect } from 'react';
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

  // Adds persistent favorites using localStorage. Enhances user experience by allowing them to mark and recall sounds.
  // (better way than using localStorage?)
  const [starred, setStarred] = useState(() => new Set(JSON.parse(localStorage.getItem('starredSounds') || '[]')));

  const { BASE_URL } = import.meta.env;
  const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

  useEffect(() => {
    localStorage.setItem('starredSounds', JSON.stringify(Array.from(starred)));
  }, [starred]); // Automatically saves favorites when updated

  const soundEntries = useMemo(() => {
    if (!sounds) return [];
    return Object.entries(sounds)
      .filter(([key]) => !key.startsWith('_'))
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [sounds, search]);

  const filteredEntries = useMemo(() => {
    if (soundsFilter === 'user') {
      return soundEntries.filter(([_, { data }]) => !data.prebake);
    }
    if (soundsFilter === 'drums') {
      return soundEntries.filter(([_, { data }]) => data.type === 'sample' && data.tag === 'drum-machines');
    }
    if (soundsFilter === 'samples') {
      return soundEntries.filter(([_, { data }]) => data.type === 'sample' && data.tag !== 'drum-machines');
    }
    if (soundsFilter === 'synths') {
      return soundEntries.filter(([_, { data }]) => ['synth', 'soundfont'].includes(data.type));
    }
    if (soundsFilter === 'starred') {
      return soundEntries.filter(([name]) => starred.has(name));
    }
    if (soundsFilter === 'importSounds') {
      return [];
    }
    return soundEntries;
  }, [soundEntries, soundsFilter, starred]);

  // Organizes sound list into collapsible folders for better navigation and visual clarity.
  const groupedByFolder = useMemo(() => {
    const groups = {};
    for (const [name, { data, onTrigger }] of filteredEntries) {
      const folder = data.folder || name.split('(')[0];
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push([name, { data, onTrigger }]);
    }
    return groups;
  }, [filteredEntries]);

  const trigRef = useRef();

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
            starred: '⭐',
          }}
        ></ButtonGroup>
      </div>

      <div className="min-h-0 max-h-full grow overflow-auto text-sm break-normal pb-2">
        {Object.entries(groupedByFolder).map(([folder, entries]) => (
          <details key={folder} className="mb-2">
            <summary className="cursor-pointer font-semibold">{folder}</summary>
            <div className="pl-4">
              {entries.map(([name, { data, onTrigger }]) => (
                <div key={name} className="flex justify-between mr-5 items-center py-1">
                  <span
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
                    {name} {data?.type === 'sample' ? `(${getSamples(data.samples)})` : ''}
                    {data?.type === 'soundfont' ? `(${data.fonts.length})` : ''}
                  </span>
                  <button
                    className="ml-2 text-yellow-400 hover:text-yellow-600"
                    onClick={() => {
                      setStarred((prev) => {
                        const next = new Set(prev);
                        next.has(name) ? next.delete(name) : next.add(name);
                        return next;
                      });
                    }}
                  >
                    {starred.has(name) ? '★' : '☆'}
                  </button>
                </div>
              ))}
            </div>
          </details>
        ))}

        {!Object.keys(groupedByFolder).length && soundsFilter === 'importSounds' ? (
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
        ) : null}

        {!Object.keys(groupedByFolder).length && soundsFilter !== 'importSounds'
          ? 'No custom sounds loaded in this pattern (yet).'
          : ''}
      </div>
    </div>
  );
}
