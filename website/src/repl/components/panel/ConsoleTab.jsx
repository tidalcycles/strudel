import { logger } from '@strudel/core';
import useEvent from '@src/useEvent.mjs';
import cx from '@src/cx.mjs';
import { nanoid } from 'nanoid';
import { useCallback, useState } from 'react';
import { useSettings } from '../../../settings.mjs';

function getUpdatedLog(log, event) {
  const { message, type, data } = event.detail;
  const lastLog = log.length ? log[log.length - 1] : undefined;
  const id = nanoid(12);
  // if (type === 'loaded-sample' && lastLog.type === 'load-sample' && lastLog.url === data.url) {
  if (type === 'loaded-sample') {
    // const loadIndex = log.length - 1;
    const loadIndex = log.findIndex(({ data: { url }, type }) => type === 'load-sample' && url === data.url);
    log[loadIndex] = { message, type, id, data };
  } else if (lastLog && lastLog.message === message) {
    log = log.slice(0, -1).concat([{ message, type, count: (lastLog.count ?? 1) + 1, id, data }]);
  } else {
    log = log.concat([{ message, type, id, data }]);
  }
  return log.slice(-20);
}

//ensures that the log state persists when component is remounted
let logSaved = [];
export function ConsoleTab() {
  const [log, setLog] = useState(logSaved);
  const { fontFamily } = useSettings();

  useLogger(
    useCallback((event) => {
      setLog((log) => {
        const newLog = getUpdatedLog(log, event);
        logSaved = newLog;
        return newLog;
      });
    }, []),
  );
  return (
    <div id="console-tab" className="break-all  first-line:text-sm p-2  h-full" style={{ fontFamily }}>
      <div className="bg-background h-full overflow-auto space-y-1 p-2 rounded-md">
        {log.map((l, i) => {
          const message = linkify(l.message);
          const color = l.data?.hap?.value?.color;
          return (
            <div
              key={l.id}
              className={cx(
                l.type === 'error' ? 'text-background bg-foreground' : 'text-foreground',
                l.type === 'highlight' && 'underline',
              )}
              style={color ? { color } : {}}
            >
              <span dangerouslySetInnerHTML={{ __html: message }} />
              {l.count ? ` (${l.count})` : ''}
            </div>
          );
        })}
      </div>
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
