import { Fragment, useEffect } from 'react';
import React, { useMemo, useState } from 'react';
import { isAudioFile, readDir, dir, playFile } from '../../files.mjs';

export function FilesTab() {
  const [path, setPath] = useState([]);
  useEffect(() => {
    let init = false;
    readDir('', { dir, recursive: true })
      .then((children) => setPath([{ name: '~/music', children }]))
      .catch((err) => {
        console.log('error loadin files', err);
      });
    return () => {
      init = true;
    };
  }, []);
  const current = useMemo(() => path[path.length - 1], [path]);
  const subpath = useMemo(
    () =>
      path
        .slice(1)
        .map((p) => p.name)
        .join('/'),
    [path],
  );
  const folders = useMemo(() => current?.children.filter((e) => !!e.children), [current]);
  const files = useMemo(() => current?.children.filter((e) => !e.children && isAudioFile(e.name)), [current]);
  const select = (e) => setPath((p) => p.concat([e]));
  return (
    <div className="px-4 flex flex-col h-full">
      <div className="flex justify-between font-mono pb-1">
        <div>
          <span>{`samples('`}</span>
          {path?.map((p, i) => {
            if (i < path.length - 1) {
              return (
                <Fragment key={i}>
                  <span className="cursor-pointer underline" onClick={() => setPath((p) => p.slice(0, i + 1))}>
                    {p.name}
                  </span>
                  <span>/</span>
                </Fragment>
              );
            } else {
              return (
                <span className="cursor-pointer underline" key={i}>
                  {p.name}
                </span>
              );
            }
          })}
          <span>{`')`}</span>
        </div>
      </div>
      <div className="overflow-auto">
        {!folders?.length && !files?.length && <span className="text-gray-500">Nothing here</span>}
        {folders?.map((e, i) => (
          <div className="cursor-pointer" key={i} onClick={() => select(e)}>
            {e.name}
          </div>
        ))}
        {files?.map((e, i) => (
          <div
            className="text-gray-500 cursor-pointer select-none"
            key={i}
            onClick={async () => playFile(`${subpath}/${e.name}`)}
          >
            {e.name}
          </div>
        ))}
      </div>
    </div>
  );
}
