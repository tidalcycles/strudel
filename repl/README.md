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
npm run setup
npm run repl
```

## Build REPL

```bash
cd repl
npm run build # <- builds repl + tutorial to ../docs
npm run static # <- test static build
```

## TODO vite

- "build": "BUILD_PATH='../docs' react-scripts build && npm run build-tutorial && npm run add-license",