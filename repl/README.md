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

## Refactoring Notes

currently broken / buggy:

- MiniREPL
- repl log section
- hideHeader flag
- pending flag
- web midi
- draw / pianoroll
- pause does stop
- random button triggers start
- highlighting seems too late (off by latency ?)
