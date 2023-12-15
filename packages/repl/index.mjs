// nanostores use process.env which kills the browser build
window.process = {
  env: {
    NODE_ENV: 'development',
  },
};

export * from './repl-component.mjs';
