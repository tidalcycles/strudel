import { registerSound, onTriggerSample } from '@strudel/webaudio';
import { isAudioFile } from './files.mjs';
import { logger } from '@strudel/core';

//utilites for writing and reading to the indexdb

export const userSamplesDBConfig = {
  dbName: 'samples',
  table: 'usersamples',
  columns: ['blob', 'title'],
  version: 1,
};

// deletes all of the databases, useful for debugging
const clearIDB = () => {
  window.indexedDB
    .databases()
    .then((r) => {
      for (var i = 0; i < r.length; i++) window.indexedDB.deleteDatabase(r[i].name);
    })
    .then(() => {
      alert('All data cleared.');
    });
};

// queries the DB, and registers the sounds so they can be played
export const registerSamplesFromDB = (config = userSamplesDBConfig, onComplete = () => {}) => {
  openDB(config, (objectStore) => {
    let query = objectStore.getAll();
    query.onsuccess = (event) => {
      const soundFiles = event.target.result;
      if (!soundFiles?.length) {
        return;
      }
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
      logger('imported sounds registered!', 'success');
      onComplete();
    };
  });
};
// creates a blob from a buffer that can be read
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
//open db and initialize it if necessary
const openDB = (config, onOpened) => {
  const { dbName, version, table, columns } = config;
  if (typeof window === 'undefined') {
    return;
  }
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
    logger('Something went wrong while trying to open the the client DB', 'error');
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
    logger('Something went wrong while processing uploaded files', 'error');
    console.error(error);
  });
};

export const uploadSamplesToDB = async (config, files) => {
  await processFilesForIDB(files).then((files) => {
    const onOpened = (objectStore, _db) => {
      files.forEach((file) => {
        if (file == null) {
          return;
        }
        objectStore.put(file);
      });
    };
    openDB(config, onOpened);
  });
};
