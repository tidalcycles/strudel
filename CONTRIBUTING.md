# 🌀 Contributing to Strudel 🌀

Thanks for wanting to contribute!!! There are many ways you can add value to this project

## Communication Channels

To get in touch with the contributors, either

- open a [github discussion](https://github.com/tidalcycles/strudel/discussions) or
- [join the Tidal Discord Channel](https://discord.gg/remJ6gQA) and go to the #strudel channel
- Find related discussions on the [tidal club forum](https://club.tidalcycles.org/)

## Ask a Question

If you have any questions about strudel, make sure you've glanced through the
[docs](https://strudel.tidalcycles.org/learn/) to find out if it answers your question.
If not, use one of the Communication Channels above!

Don't be afraid to ask! Your question might be of great value for other people too.

## Give Feedback

No matter if you've used the Strudel REPL or if you are using the strudel packages, we are happy to hear some feedback.
Use one of the Communication Channels listed above and drop us a line or two!

## Share Music

If you made some music with strudel, you can give back some love and share what you've done!
Your creation could also be part of the random selection in the REPL if you want.
Use one of the Communication Channels listed above.

## Improve the Docs

If you find some weak spots in the [docs](https://strudel.tidalcycles.org/learn/getting-started),
you can edit each file directly on github via the "Edit this page" link located in the right sidebar.

## Propose a Feature

If you want a specific feature that is not part of strudel yet, feel free to use one of the communication channels above.
Maybe you even want to help with the implementation of that feature!

## Report a Bug

If you've found a bug, or some behaviour that does not seem right, you are welcome to file an [issue](https://github.com/tidalcycles/strudel/issues).
Please check that it has not been reported before.

## Fix a Bug

To fix a bug that has been reported,

1. check that nobody else is already fixing it and respond to the issue to let people know you're on it
2. fork the repository
3. make sure you've setup the project (see below)
4. hopefully fix the bug
5. make sure the tests pass
6. send a pull request

## Write Tests

There are still many tests that have not been written yet! Reading and writing tests is a great opportunity to get familiar with the codebase.
You can find the tests in each package in the `test` folder. To run all tests, run `npm test` from the root folder.

## Project Setup

To get the project up and running for development, make sure you have installed:

- git
- node, preferably v16

then, do the following:

```sh
git clone https://github.com/tidalcycles/strudel.git && cd strudel
npm i # install at root to symlink packages
npx lerna bootstrap # install all dependencies in packages
cd repl && npm i # install repl dependencies
npm run start # start repl
```

Those commands might look slightly different for your OS.
Please report any problems you've had with the setup instructions!

## Code Style

To make sure the code changes only where it should, we are using prettier to unify the code style.
If you use VSCode, you can

1. install [the prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
2. open command palette and run "Format Document With..."
3. Choose "Configure Default Formatter..."
4. Select prettier

## Package Workflow

The project is split into multiple [packages](https://github.com/tidalcycles/strudel/tree/main/packages) with independent versioning.
When you run `npm i` on the root folder, [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) will symlink all packages
in the `node_modules` folder. This will allow any js file to import `@strudel.cycles/<package-name>` to get the local version,
which allows developing multiple packages at the same time

## Package Publishing

To publish all packages that have been changed since the last release, run:

```sh
npm login
npx lerna publish
```

### New Packages

To add a new package, you have to publish it manually the first time, using:

```sh
cd packages/<package-name> && npm publish --access public
```

## Have Fun

Remember to have fun, and that this project is driven by the passion of volunteers!
