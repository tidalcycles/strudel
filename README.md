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

## Publish Packages

To publish, just run:

```sh
npx lerna version
```

This will publish all packages that changed since the last version.

## Style

For now, please try to copy the style of surrounding code. VS Code users can install the 'prettier' add-on which will use the .prettierrc configuration file for automatic formatting.

## Community

There is a #strudel channel on the TidalCycles discord: https://discord.com/invite/HGEdXmRkzT

You can also ask questions and find related discussions on the tidal club forum: https://club.tidalcycles.org/

The discord and forum is shared with the haskell (tidal) and python (vortex) siblings of this project.