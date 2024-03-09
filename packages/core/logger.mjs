export const logKey = 'strudel.log';

let debounce = 1000,
  lastMessage,
  lastTime;

export function logger(message, type, data = {}) {
  let t = performance.now();
  if (lastMessage === message && t - lastTime < debounce) {
    return;
  }
  lastMessage = message;
  lastTime = t;
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
