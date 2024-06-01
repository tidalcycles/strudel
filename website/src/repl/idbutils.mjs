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
    // const keys = objectStore.getAllKeys();

    // keys.onsuccess = (e) => {
    //   console.log(e);
    //   const result = e.target.result[0];
    //   console.log(result);

    //   const q = objectStore.get(result);
    //   q.onerror = (e) => console.error(e.target.error);
    //   q.onsuccess = (e) => console.log(e);
    // };

    let query = objectStore.getAll();
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
      console.log(soundFiles);
      const sounds = new Map();
      [...soundFiles]
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }))
        .forEach((soundFile, i) => {
          const title = soundFile.title;
          if (!isAudioFile(title)) {
            return;
          }
          const splitRelativePath = soundFile.id.split('/');
          let parentDirectory =
            //fallback to file name before period and seperator if no parent directory
            splitRelativePath[splitRelativePath.length - 2] ?? soundFile.id.split(/\W+/)[0] ?? 'user';

          const soundPath = blobToDataUrl(soundFile.blob);

          // const soundPath = soundFile.blob;
          const soundPaths = sounds.get(parentDirectory) ?? new Set();
          soundPaths.add(soundPath);
          sounds.set(parentDirectory, soundPaths);
        });

      sounds.forEach((soundPaths, key) => {
        const paths = Array.from(soundPaths);
        Promise.all(paths).then((value) => {
          // console.log({ value });
          registerSound(key, (t, hapValue, onended) => onTriggerSample(t, hapValue, onended, value), {
            type: 'sample',
            samples: value,
            baseUrl: undefined,
            prebake: false,
            tag: undefined,
          });
        });
      });
      logger('imported sounds registered!', 'success');
      onComplete();
    };
  });
}
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

function bufferToBlob(buf) {
  return new Blob([buf], { type: 'application/octet-binary' });
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
              // buf,
              blob,
              id,
            };
          });
        });

        //create a url base64 containing all of the buffer data
        // const base64 = await bufferToDataUrl(buf);
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
    console.log(files);
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
