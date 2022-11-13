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
- [x] repl log section
- [ ] hideHeader flag
- [ ] pending flag
- [x] web midi, TODO: test
- [x] draw / pianoroll
- [x] repl url hash does not work
- [x] pause does stop
- [-] pause then play logs "TOO LATE" and drops some events => now doing full stop
- [x] random button triggers start
- [x] unexpected ast format without body expression (kalimba)
- [x] highlighting seems too late (off by latency ?)
- [x] highlighting sometimes drops highlights (zeldasRescue first note)
- [x] highlighting still sometimes drops highlights (zeldasRescue somtimes)
- [ ] highlighting out of range error is back (delete large chunk at the top while highlighting below is triggered)
- [ ] find a way to display errors when console is closed / another tab selected
- [x] scheduler.getPhase is quantized to clock interval
  - => draw was choppy + that also caused useHighlighting bugs
- [ ] pianoroll keeps rolling when pressing stop