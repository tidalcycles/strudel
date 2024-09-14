# 🌀 Contributing to Strudel 🌀

Thanks for wanting to contribute!!! There are many ways you can add value to this project

## Communication Channels

To get in touch with the contributors, either

- open a [github discussion](https://github.com/tidalcycles/strudel/discussions) or
- [join the Tidal Discord Channel](https://discord.gg/remJ6gQA) and go to the #strudel channel
- Find related discussions on the [tidal club forum](https://club.tidalcycles.org/)

## Ask a Question

If you have any questions about strudel, make sure you've glanced through the
[docs](https://strudel.cc/learn/) to find out if it answers your question.
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

If you find some weak spots in the [docs](https://strudel.cc/workshop/getting-started/),
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
You can find the tests in each package in the `test` folder. To run all tests, run `pnpm test` from the root folder.

## Project Setup

To get the project up and running for development, make sure you have installed:

- [git](https://git-scm.com/)
- [node](https://nodejs.org/en/) >= 18
- [pnpm](https://pnpm.io/) (`curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=8.11.0 sh -`)

then, do the following:

```sh
git clone https://github.com/tidalcycles/strudel.git && cd strudel
pnpm i # install at root to symlink packages
pnpm start # start repl
```

Those commands might look slightly different for your OS.
Please report any problems you've had with the setup instructions!

## Code Style

To make sure the code changes only where it should, we are using prettier to unify the code style.

- You can format all files at once by running `pnpm codeformat` from the project root
- Run `pnpm format-check` from the project root to check if all files are well formatted

If you use VSCode, you can

1. install [the prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
2. open command palette and run "Format Document With..."
3. Choose "Configure Default Formatter..."
4. Select prettier

## ESLint

To prevent unwanted runtime errors, this project uses [eslint](https://eslint.org/).

- You can check for lint errors by running `pnpm lint`

There are also eslint extensions / plugins for most editors.

## Running Tests

- Run all tests with `pnpm test`
- Run all tests with UI using `pnpm test-ui`

## Running all CI Checks

When opening a PR, the CI runner will automatically check the code style and eslint, as well as run all tests.
You can run the same check with `pnpm check`

## Package Workflow

The project is split into multiple [packages](https://github.com/tidalcycles/strudel/tree/main/packages) with independent versioning.
When you run `pnpm i` on the root folder, [pnpm workspaces](https://pnpm.io/workspaces) will install all dependencies of all subpackages. This will allow any js file to import `@strudel/<package-name>` to get the local version,
allowing to develop multiple packages at the same time.

## Package Publishing

To publish all packages that have been changed since the last release, run:

```sh
npm login

# this will increment all the versions in package.json files of non private packages to selected versions
npx lerna version --no-private

# publish all packages inside /packages using pnpm! don't use lerna to publish!!
pnpm --filter "./packages/**" publish --dry-run

# the last command was only a dry-run. if everything looks ok, run this:

pnpm --filter "./packages/**" publish --access public
```

To manually publish a single package, increase the version in the `package.json`, then run `pnpm publish`.
Important: Always publish with `pnpm`, as `npm` does not support overriding main files in `publishConfig`, which is done in all the packages.

## Have Fun

Remember to have fun, and that this project is driven by the passion of volunteers!
