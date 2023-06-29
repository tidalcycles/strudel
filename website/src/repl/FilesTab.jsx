import { Fragment, useEffect } from 'react';
import { getAudioContext, loadBuffer, processSampleMap } from '@strudel.cycles/webaudio';
import React, { useMemo, useState } from 'react';

const TAURI = window.__TAURI__;
const { BaseDirectory, readDir, readBinaryFile, writeTextFile, readTextFile } = TAURI?.fs || {};

async function loadFiles() {
  return readDir('', { dir: BaseDirectory.Audio, recursive: true });
}

const walkFileTree = (node, fn) => {
  if (!Array.isArray(node?.children)) {
    return;
  }
  for (const entry of node.children) {
    entry.subpath = (node.subpath || []).concat([node.name]);
    fn(entry, node);
    if (entry.children) {
      walkFileTree(entry, fn);
    }
  }
};

const isAudioFile = (filename) => ['wav', 'mp3'].includes(filename.split('.').slice(-1)[0]);
function uint8ArrayToDataURL(uint8Array) {
  const blob = new Blob([uint8Array], { type: 'audio/*' });
  const dataURL = URL.createObjectURL(blob);
  return dataURL;
}

const loadCache = {}; // caches local urls to data urls
async function resolveFileURL(url) {
  if (loadCache[url]) {
    return loadCache[url];
  }
  loadCache[url] = (async () => {
    const contents = await readBinaryFile(url, {
      dir: BaseDirectory.Audio,
    });
    return uint8ArrayToDataURL(contents);
  })();
  return loadCache[url];
}

export function FilesTab() {
  const [path, setPath] = useState([]);
  useEffect(() => {
    let init = false;
    loadFiles().then((_tree) => setPath([{ name: 'files', children: _tree, path: BaseDirectory.Audio }]));
    return () => {
      init = true;
    };
  }, []);
  const current = useMemo(() => path[path.length - 1], [path]);
  const strudelJson = useMemo(() => current?.children?.find((e) => e.name === 'strudel.json'), [current]);
  const subpath = useMemo(
    () =>
      path
        .slice(1)
        .map((p) => p.name)
        .join('/'),
    [path],
  );
  const folders = useMemo(() => current?.children.filter((e) => !!e.children), [current]);

  const files = useMemo(
    () => current?.children.filter((e) => !e.children && isAudioFile(e.name) /* || e.name === 'strudel.json' */),
    [current],
  );
  const audioFiles = useMemo(() => {
    let files = [];
    walkFileTree(current, (entry) => {
      if (isAudioFile(entry.name)) {
        files.push(entry);
      }
    });
    return files;
  }, [current]);
  const select = (e) => setPath((p) => p.concat([e]));

  return (
    <div className="px-4 flex flex-col h-full">
      <div className="flex justify-between">
        <div>
          {path?.map((p, i) => {
            if (i < path.length - 1) {
              return (
                <Fragment key={i}>
                  <span className="cursor-pointer underline" onClick={() => setPath((p) => p.slice(0, i + 1))}>
                    {p.name}
                  </span>{' '}
                  /{' '}
                </Fragment>
              );
            } else {
              return (
                <span className="underline" key={i}>
                  {p.name}{' '}
                </span>
              );
            }
          })}
        </div>
      </div>
      <div className="overflow-auto">
        {folders?.map((e, i) => (
          <div className="cursor-pointer" key={i} onClick={() => select(e)}>
            {e.name}
          </div>
        ))}
        {files?.map((e, i) => (
          <div
            className="text-gray-500 cursor-pointer select-none"
            key={i}
            onClick={async () => {
              const url = await resolveFileURL(`${subpath}/${e.name}`);
              const ac = getAudioContext();
              const bufferSource = ac.createBufferSource();
              bufferSource.buffer = await loadBuffer(url, ac);
              bufferSource.connect(ac.destination);
              bufferSource.start(ac.currentTime);
            }}
          >
            {e.name}
          </div>
        ))}
      </div>

      <div className="flex justify-start space-x-2">
        <button
          className="bg-background p-2 max-w-[300px] rounded-md hover:opacity-50"
          onClick={async () => {
            let samples = {};
            walkFileTree(current, (entry, parent) => {
              if (['wav', 'mp3'].includes(entry.name.split('.').slice(-1)[0])) {
                samples[parent.name] = samples[parent.name] || [];
                samples[parent.name].push(entry.subpath.slice(1).concat([entry.name]).join('/'));
              }
            });
            const json = JSON.stringify(samples, null, 2);
            const filepath = subpath + '/strudel.json';
            console.log('strudel.json', json);
            await writeTextFile(filepath, json, { dir: BaseDirectory.Audio });
            console.log('written strudel.json to:', current.path);
          }}
        >
          save strudel.json with {audioFiles.length} files
        </button>
        {strudelJson && (
          <>
            <button
              className="bg-background p-2 max-w-[300px] rounded-md hover:opacity-50"
              onClick={async () => {
                const contents = await readTextFile(subpath + '/strudel.json', {
                  dir: BaseDirectory.Audio,
                });
                const sampleMap = JSON.parse(contents);
                processSampleMap(sampleMap, (key, value) => {
                  registerSound(
                    key,
                    (t, hapValue, onended) => onTriggerSample(t, hapValue, onended, value, resolveFileURL),
                    {
                      type: 'sample',
                      samples: value,
                      fileSystem: true,
                      tag: 'local',
                      /* baseUrl,
                prebake,
                tag, */
                    },
                  );
                });
              }}
            >
              load existing strudel.json
            </button>
            {/* <button className="bg-background p-2 max-w-[300px] rounded-md hover:opacity-50" onClick={async () => {
            }}>
              delete existing strudel.json
            </button> */}
          </>
        )}
      </div>
    </div>
  );
}
