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
function clearIDB() {
  window.indexedDB
    .databases()
    .then((r) => {
      for (var i = 0; i < r.length; i++) window.indexedDB.deleteDatabase(r[i].name);
    })
    .then(() => {
      alert('All data cleared.');
    });
}

// queries the DB, and registers the sounds so they can be played
export function registerSamplesFromDB(config = userSamplesDBConfig, onComplete = () => {}) {
  openDB(config, (objectStore) => {
    const query = objectStore.getAll();
    query.onerror = (e) => {
      logger('User Samples failed to load ', 'error');
      onComplete();
      console.error(e?.target?.error);
    };

    query.onsuccess = (event) => {
      const soundFiles = event.target.result;
      if (!soundFiles?.length) {
        return;
      }
      const sounds = new Map();

      Promise.all(
        [...soundFiles]
          .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }))
          .map((soundFile, i) => {
            const title = soundFile.title;
            if (!isAudioFile(title)) {
              return;
            }
            const splitRelativePath = soundFile.id.split('/');
            let parentDirectory =
              //fallback to file name before period and seperator if no parent directory
              splitRelativePath[splitRelativePath.length - 2] ?? soundFile.id.split(/\W+/)[0] ?? 'user';
            const blob = soundFile.blob;

            // Files used to be uploaded as base64 strings, After Jan 1 2025 this check can be safely deleted
            if (typeof blob === 'string') {
              const soundPaths = sounds.get(parentDirectory) ?? new Set();
              soundPaths.add(blob);
              sounds.set(parentDirectory, soundPaths);
              return;
            }

            return blobToDataUrl(blob).then((soundPath) => {
              const soundPaths = sounds.get(parentDirectory) ?? new Set();
              soundPaths.add(soundPath);
              sounds.set(parentDirectory, soundPaths);
              return;
            });
          }),
      )
        .then(() => {
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
        })
        .catch((error) => {
          logger('Something went wrong while registering saved samples from the index db', 'error');
          console.error(error);
        });
    };
  });
}

async function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    var reader = new FileReader();
    reader.onload = function (event) {
      resolve(event.target.result);
    };
    reader.readAsDataURL(blob);
  });
}

//open db and initialize it if necessary
function openDB(config, onOpened) {
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
    // lock store for writing
    const writeTransaction = db.transaction([table], 'readwrite');
    // get object store
    const objectStore = writeTransaction.objectStore(table);
    onOpened(objectStore, db);
  };
  return dbOpen;
}

async function processFilesForIDB(files) {
  return Promise.all(
    Array.from(files)
      .map((s) => {
        const title = s.name;

        if (!isAudioFile(title)) {
          return;
        }
        //create obscured url to file system that can be fetched
        const sUrl = URL.createObjectURL(s);
        //fetch the sound and turn it into a buffer array
        return fetch(sUrl).then((res) => {
          return res.blob().then((blob) => {
            const path = s.webkitRelativePath;
            let id = path?.length ? path : title;
            if (id == null || title == null || blob == null) {
              return;
            }
            return {
              title,
              blob,
              id,
            };
          });
        });
      })
      .filter(Boolean),
  ).catch((error) => {
    logger('Something went wrong while processing uploaded files', 'error');
    console.error(error);
  });
}

export async function uploadSamplesToDB(config, files) {
  logger('procesing user samples...');
  await processFilesForIDB(files).then((files) => {
    logger('user samples processed... opening db');
    const onOpened = (objectStore, _db) => {
      logger('index db opened... writing files to db');
      files.forEach((file) => {
        if (file == null) {
          return;
        }
        objectStore.put(file);
      });
      logger('user samples written successfully');
    };
    openDB(config, onOpened);
  });
}
