export const logKey = 'strudel.log';

export function logger(message, type, data = {}) {
  console.log(`%c${message}`, 'background-color: black;color:white;border-radius:15px');
  if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
    document.dispatchEvent(
      new CustomEvent(logKey, {
        detail: {
          message,
          type,
          data,
        },
      }),
    );
  }
}

logger.key = logKey;
