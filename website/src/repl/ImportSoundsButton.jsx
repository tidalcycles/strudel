import React from 'react';
import { isAudioFile } from './files.mjs';

//choose a directory to locally import samples
export default function ImportSoundsButton({ onComplete }) {
  let fileUploadRef = React.createRef();
  function mapFiles(soundFiles) {
    const sounds = new Map();
    Array.from(soundFiles)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
      .forEach((soundFile) => {
        const name = soundFile.name;
        if (!isAudioFile(name)) {
          return;
        }
        const splitRelativePath = soundFile.webkitRelativePath?.split('/');
        const parentDirectory = splitRelativePath[splitRelativePath.length - 2];
        const soundPath = URL.createObjectURL(soundFile);
        const soundPaths = sounds.get(parentDirectory) ?? new Set();
        soundPaths.add(soundPath);

        sounds.set(parentDirectory, soundPaths);
      });
    sounds.forEach((soundPaths, key) => {
      const value = Array.from(soundPaths);
      registerSound(key, (t, hapValue, onended) => onTriggerSample(t, hapValue, onended, value), {
        type: 'sample',
        samples: value,
        baseUrl: undefined,
        prebake: false,
        tag: undefined,
      });
    });
    onComplete();
  }

  return (
    <label
      style={{ alignItems: 'center' }}
      className="flex bg-background ml-2 pl-2 pr-2 max-w-[300px] rounded-md hover:opacity-50"
    >
      <input
        ref={fileUploadRef}
        id="audio_file"
        style={{ display: 'none' }}
        type="file"
        directory=""
        webkitdirectory=""
        multiple
        accept="audio/*"
        onChange={() => {
          mapFiles(fileUploadRef.current.files);
        }}
      />
      import sounds
    </label>
  );
}
