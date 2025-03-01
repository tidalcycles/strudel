import useEvent from '@src/useEvent.mjs';
import { logger } from '@strudel/core';
import { nanoid } from 'nanoid';
import { atom } from 'nanostores';

export const $strudel_log_history = atom([]);

function useLoggerEvent(onTrigger) {
  useEvent(logger.key, onTrigger);
}

function getUpdatedLog(log, event) {
  const { message, type, data } = event.detail;
  const lastLog = log.length ? log[log.length - 1] : undefined;
  const id = nanoid(12);
  if (type === 'loaded-sample') {
    const loadIndex = log.findIndex(({ data: { url }, type }) => type === 'load-sample' && url === data.url);
    log[loadIndex] = { message, type, id, data };
  } else if (lastLog && lastLog.message === message) {
    log = log.slice(0, -1).concat([{ message, type, count: (lastLog.count ?? 1) + 1, id, data }]);
  } else {
    log = log.concat([{ message, type, id, data }]);
  }
  return log.slice(-20);
}

export function useLogger() {
  useLoggerEvent((event) => {
    const log = $strudel_log_history.get();
    const newLog = getUpdatedLog(log, event);
    $strudel_log_history.set(newLog);
  });
}
