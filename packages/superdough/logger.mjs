let log = (msg) => console.log(msg);

export const logger = (...args) => log(...args);

export const setLogger = (fn) => {
  log = fn;
};
