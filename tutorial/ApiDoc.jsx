import React, { Fragment } from 'react';
import { docs } from '../doc.json';
import { MiniRepl } from './MiniRepl';

function ApiDoc() {
  // console.log('docJson', docs);
  return (
    <div>
      {docs
        .filter((item) => !item.name?.startsWith('_') && item.kind !== 'package')
        .map((item, i) => (
          <Fragment key={i}>
            {' '}
            <h2 id={`${item.memberof ? `${item.memberof}-` : ''}${item.name}`}>
              {item.memberof && item.memberof !== item.name ? `${item.memberof}.` : ''}
              {item.name}
            </h2>
            <div
              dangerouslySetInnerHTML={{
                __html: item.description.replaceAll(/\{\@link ([a-zA-Z]+)?\#?([a-zA-Z]*)\}/g, (_, a, b) => {
                  // console.log(_, 'a', a, 'b', b);
                  return `<a href="#${a}${b ? `-${b}` : ''}">${a}${b ? `#${b}` : ''}</a>`;
                }),
              }}
            />
            <h3>Parameters</h3>
            <ul>
              {item.params?.map((param, i) => (
                <li key={i}>
                  {param.name} ({param.type?.names?.join('|')}): {param.description?.replace(/(<([^>]+)>)/gi, '')}
                </li>
              ))}
            </ul>
            {item.examples?.length && <h3>Examples</h3>}
            <div className="space-y-2">
              {item.examples?.map((example, k) => (
                <MiniRepl key={k} tune={example} />
              ))}
            </div>
          </Fragment>
        ))}
    </div>
  );
}

export default ApiDoc;
