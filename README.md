# strudel

[![Strudel test status](https://github.com/tidalcycles/strudel/actions/workflows/test.yml/badge.svg)](https://github.com/tidalcycles/strudel/actions)

An experiment in making a [Tidal](https://github.com/tidalcycles/tidal/) using web technologies. This is unstable software, please tread carefully.

Try it here: https://strudel.tidalcycles.org/

Tutorial: https://strudel.tidalcycles.org/tutorial/

## Local development

Run the REPL locally:

```bash
npm install
npx lerna bootstrap
cd repl
npm install
npm run start
```

## Build

```bash
cd repl
npm run build
npm run static # <- test static build
```
