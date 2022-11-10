# Packages

Each folder represents one of the @strudel.cycles/* packages [published to npm](https://www.npmjs.com/org/strudel.cycles).

To understand how those pieces connect, refer to the [Technical Manual](https://github.com/tidalcycles/strudel/wiki/Technical-Manual) or the individual READMEs.

This is a graphical view of all the packages: [full screen](https://raw.githubusercontent.com/tidalcycles/strudel/main/dependencies.svg)

![dependencies](https://raw.githubusercontent.com/tidalcycles/strudel/main/dependencies.svg)

Generated with

```sh
npx depcruise --include-only "^packages" -X "node_modules" --output-type dot packages | dot -T svg > dependencygraph.svg
```
