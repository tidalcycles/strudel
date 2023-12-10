import React, { useCallback, useEffect } from 'react';
import { registerSound, onTriggerSample } from '@strudel.cycles/webaudio';
import { isAudioFile } from './files.mjs';

//choose a directory to locally import samples

const userSamplesDBConfig = {
  dbName: 'samples',
  table: 'usersamples',
  columns: ['blob', 'title'],
  version: 1,
};

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

const registerSamplesFromDB = (config) => {
  openDB(config, (objectStore) => {
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

const openDB = (config, onOpened) => {
  const { dbName, version, table, columns } = config;
  if (!('indexedDB' in window)) {
    console.log('IndexedDB is not supported.');
    return;
  }
  const dbOpen = indexedDB.open(dbName, version);

  dbOpen.onupgradeneeded = (_event) => {
    const db = dbOpen.result;
    const objectStore = db.createObjectStore(table, { keyPath: 'id', autoIncrement: false });
    columns.forEach((c) => {
      objectStore.createIndex(c, c, { unique: false });
    });
  };
  dbOpen.onerror = (err) => {
    console.error(`indexedDB error: ${err.errorCode}`);
  };

  dbOpen.onsuccess = () => {
    const db = dbOpen.result;

    const // lock store for writing
      writeTransaction = db.transaction([table], 'readwrite'),
      // get object store
      objectStore = writeTransaction.objectStore(table);
    onOpened(objectStore, db);
  };
};

const processFilesForIDB = async (files) => {
  return await Promise.all(
    Array.from(files)
      .map(async (s) => {
        const title = s.name;
        if (!isAudioFile(title)) {
          return;
        }
        //create obscured url to file system that can be fetched
        const sUrl = URL.createObjectURL(s);
        //fetch the sound and turn it into a buffer array
        const buf = await fetch(sUrl).then((res) => res.arrayBuffer());
        //create a url blob containing all of the buffer data
        const base64 = await bufferToDataUrl(buf);
        return {
          title,
          blob: base64,
          id: s.webkitRelativePath,
        };
      })
      .filter(Boolean),
  ).catch((error) => {
    console.error(error);
  });
};

const uploadSamplesToDB = async (config, files) => {
  // clearData();
  await processFilesForIDB(files).then((files) => {
    const onOpened = (objectStore, _db) => {
      files.forEach((file) => {
        if (file == null) {
          return;
        }
        const mutation = objectStore.put(file);
        mutation.onsuccess = () => {};
      });
    };
    openDB(config, onOpened);
  });
};

export default function ImportSoundsButton({ onComplete }) {
  let fileUploadRef = React.createRef();
  const onChange = useCallback(async () => {
    await uploadSamplesToDB(userSamplesDBConfig, fileUploadRef.current.files).then(() => {
      registerSamplesFromDB(userSamplesDBConfig);
      onComplete();
    });
  });

  useEffect(() => {
    registerSamplesFromDB(userSamplesDBConfig);
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
