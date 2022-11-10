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

- [x] MiniREPL
- [ ] repl log section => remove?
- [ ] hideHeader flag
- [ ] pending flag
- [ ] web midi
- [ ] draw / pianoroll
- [x] pause does stop
- [ ] pause then play logs "TOO LATE" and drops some events
- [x] random button triggers start
- [ ] unexpected ast format without body expression (kalimba)
- [x] highlighting seems too late (off by latency ?)
- [x] highlighting sometimes drops highlights (zeldasRescue first note)
- [ ] highlighting still sometimes drops highlights (zeldasRescue somtimes)
