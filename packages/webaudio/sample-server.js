// "sampler": "cd ./repl/public/samples && node ../../../packages/webaudio/sample-server.js",
// "sampler": "http-server ./repl/public",

import fs from 'fs';
import path from 'path';
import Koa from 'koa'; // CJS: require('koa');
import cors from '@koa/cors';
import serve from 'koa-static'; // CJS: require('koa-static')
const cwd = process.cwd();
const yellow = '\x1b[33m%s\x1b[0m';

// get array of all folders in cwd:
const banks = fs.readdirSync(cwd).filter((f) => fs.statSync(path.join(cwd, f)).isDirectory());
const app = new Koa();

app.use(cors());
app.use(serve(cwd));
app.use((ctx, next) => {
  return next().then(() => {
    if (ctx.path === '/') {
      ctx.body = 'banks: ' + banks.join(', ');
    }
  });
});
const port = 1234;
app.listen(port);

console.log(yellow, `strudel sampler running at http://localhost:${port}`);

// node: get current working directory
console.log(yellow, 'cwd: ' + cwd);

console.log('found banks:');
banks.map((c) => console.log(yellow, c));
