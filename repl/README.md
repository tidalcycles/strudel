# Strudel REPL

This is the REPL for Strudel. REPL stands for

- Read
- Evaluate
- Play!
- Loop

The REPL is deployed at [strudel.tidalcycles.org](https://strudel.tidalcycles.org/).

## Run REPL locally

```bash
# from project root
npm install
npx lerna bootstrap
cd repl
npm install
npm run start
```

## Build REPL

```bash
cd repl
npm run build # <- builds repl + tutorial to ../docs
npm run static # <- test static build
```

## Dev Notes

~~Always run `npm i --legacy-peer-deps`, otherwise `@tonejs/piano` will break.~~
