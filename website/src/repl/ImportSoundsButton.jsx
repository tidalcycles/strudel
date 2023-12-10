import React, { useCallback, useEffect } from 'react';
import { registerSound, onTriggerSample } from '@strudel.cycles/webaudio';
import { isAudioFile } from './files.mjs';

//choose a directory to locally import samples
const userSamplesDB = 'testdb3';
const sampleObject = 'testsamples';

function clearData() {
  window.indexedDB
    .databases()
    .then((r) => {
      for (var i = 0; i < r.length; i++) window.indexedDB.deleteDatabase(r[i].name);
    })
    .then(() => {
      alert('All data cleared.');
    });
}

const registerSamples = () => {
  openDB((objectStore) => {
    let query = objectStore.getAll();
    query.onsuccess = (event) => {
      const soundFiles = event.target.result;
      const sounds = new Map();
      [...soundFiles]
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }))
        .forEach((soundFile) => {
          const title = soundFile.title;
          if (!isAudioFile(title)) {
            return;
          }
          const splitRelativePath = soundFile.id?.split('/');
          const parentDirectory = splitRelativePath[splitRelativePath.length - 2];
          const soundPath = soundFile.blob;
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
    };
  });
};

async function bufferToDataUrl(buf) {
  return new Promise((resolve) => {
    var blob = new Blob([buf], { type: 'application/octet-binary' });
    var reader = new FileReader();
    reader.onload = function (event) {
      resolve(event.target.result);
    };
    reader.readAsDataURL(blob);
  });
}

const openDB = (onOpened) => {
  if ('indexedDB' in window) {
    // indexedDB supported
  } else {
    console.log('IndexedDB is not supported.');
  }
  const dbOpen = indexedDB.open(userSamplesDB, 6);

  dbOpen.onupgradeneeded = (_event) => {
    const db = dbOpen.result;
    const objectStore = db.createObjectStore(sampleObject, { keyPath: 'id', autoIncrement: false });
    // objectStore.createIndex('name', 'name', { unique: false });
    objectStore.createIndex('blob', 'blob', { unique: false });
    objectStore.createIndex('title', 'title', { unique: false });
  };
  dbOpen.onerror = (err) => {
    console.error(`indexedDB error: ${err.errorCode}`);
  };

  dbOpen.onsuccess = () => {
    const db = dbOpen.result;

    const // lock store for writing
      writeTransaction = db.transaction([sampleObject], 'readwrite'),
      // get object store
      objectStore = writeTransaction.objectStore(sampleObject);
    // objectStore.put({ title: 'test', blob: 'test' });

    onOpened(objectStore, db);
  };
};

const processFilesForIDB = async (files) => {
  return await Promise.all(
    Array.from(files).map(async (s) => {
      const title = s.name;
      if (!isAudioFile(title)) {
        return;
      }
      // const id = crypto.randomUUID();
      const sUrl = URL.createObjectURL(s);
      const buf = await fetch(sUrl).then((res) => res.arrayBuffer());
      const base64 = await bufferToDataUrl(buf);
      const f = {
        title,
        blob: base64,
        id: s.webkitRelativePath,
      };
      return f;
    }),
  ).catch((error) => {
    console.error(error);
  });
};

const setupUserSamplesDB = async (files, onComplete) => {
  //clearData();
  await processFilesForIDB(files).then((files) => {
    const onOpened = (objectStore, db) => {
      files.forEach((file) => {
        if (file == null) {
          return;
        }
        const mutation = objectStore.put(file);
        mutation.onsuccess = () => {};
      });
      onComplete(objectStore, db);
    };
    openDB(onOpened);
  });
};

export default function ImportSoundsButton({ onComplete }) {
  let fileUploadRef = React.createRef();
  const onChange = useCallback(async () => {
    await setupUserSamplesDB(fileUploadRef.current.files, (objectStore, db) => {}).then(async () => {
      registerSamples();
      onComplete();
    });
  });

  useEffect(() => {
    registerSamples();
  }, []);

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
          onChange();
        }}
      />
      import sounds
    </label>
  );
}
