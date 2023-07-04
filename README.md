# strudel

[![Strudel test status](https://github.com/tidalcycles/strudel/actions/workflows/test.yml/badge.svg)](https://github.com/tidalcycles/strudel/actions)

An experiment in making a [Tidal](https://github.com/tidalcycles/tidal/) using web technologies. This software is slowly stabilising, but please continue to tread carefully.

- Try it here: <https://strudel.tidalcycles.org/>
- Docs: <https://strudel.tidalcycles.org/learn/>
- Technical Blog Post: <https://loophole-letters.vercel.app/strudel>
- 1 Year of Strudel Blog Post: <https://loophole-letters.vercel.app/strudel1year>

## Running Locally

After cloning the project, you can run the REPL locally:

```bash
pnpm run setup
pnpm run repl
```

## Using Strudel In Your Project

There are multiple npm packages you can use to use strudel, or only parts of it, in your project:

- [`core`](./packages/core/): tidal pattern engine
- [`mini`](./packages/mini): mini notation parser + core binding
- [`transpiler`](./packages/transpiler): user code transpiler
- [`webaudio`](./packages/webaudio): webaudio output
- [`osc`](./packages/osc): bindings to communicate via OSC
- [`midi`](./packages/midi): webmidi bindings
- [`serial`](./packages/serial): webserial bindings
- [`tonal`](./packages/tonal): tonal functions
- [`xen`](./packages/xen): microtonal / xenharmonic functions
- ... [and there are more](./packages/)

Click on the package names to find out more about each one.

## Contributing

There are many ways to contribute to this project! See [contribution guide](./CONTRIBUTING.md).

<a href="https://github.com/tidalcycles/strudel/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tidalcycles/strudel" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Community

There is a #strudel channel on the TidalCycles discord: <https://discord.com/invite/HGEdXmRkzT>

You can also ask questions and find related discussions on the tidal club forum: <https://club.tidalcycles.org/>

The discord and forum is shared with the haskell (tidal) and python (vortex) siblings of this project.
