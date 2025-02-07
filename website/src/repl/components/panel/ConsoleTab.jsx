import { logger } from '@strudel/core';
import useEvent from '@src/useEvent.mjs';
import cx from '@src/cx.mjs';
import { nanoid } from 'nanoid';
import { useCallback, useState } from 'react';
import { useSettings } from '../../../settings.mjs';

export function ConsoleTab() {
  const [log, setLog] = useState([]);
  const { fontFamily, fontSize } = useSettings();
  useLogger(
    useCallback((e) => {
      const { message, type, data } = e.detail;
      setLog((l) => {
        const lastLog = l.length ? l[l.length - 1] : undefined;
        const id = nanoid(12);
        // if (type === 'loaded-sample' && lastLog.type === 'load-sample' && lastLog.url === data.url) {
        if (type === 'loaded-sample') {
          // const loadIndex = l.length - 1;
          const loadIndex = l.findIndex(({ data: { url }, type }) => type === 'load-sample' && url === data.url);
          l[loadIndex] = { message, type, id, data };
        } else if (lastLog && lastLog.message === message) {
          l = l.slice(0, -1).concat([{ message, type, count: (lastLog.count ?? 1) + 1, id, data }]);
        } else {
          l = l.concat([{ message, type, id, data }]);
        }
        return l.slice(-20);
      });
    }, []),
  );
  return (
    <div
      id="console-tab"
      className="break-all px-4 dark:text-white text-stone-900 text-sm py-2 space-y-1"
      style={{ fontFamily, fontSize }}
    >
      {log.map((l, i) => {
        const message = linkify(l.message);
        const color = l.data?.hap?.value?.color;
        return (
          <div
            key={l.id}
            className={cx(l.type === 'error' && 'text-red-500', l.type === 'highlight' && 'underline')}
            style={color ? { color } : {}}
          >
            <span dangerouslySetInnerHTML={{ __html: message }} />
            {l.count ? ` (${l.count})` : ''}
          </div>
        );
      })}
    </div>
  );
}

function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a class="underline" href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(
    replacePattern2,
    '$1<a class="underline" href="http://$2" target="_blank">$2</a>',
  );

  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a class="underline" href="mailto:$1">$1</a>');

  return replacedText;
}

function useLogger(onTrigger) {
  useEvent(logger.key, onTrigger);
}
