# @strudel/haskell

This is an experiment in implementing tree-sitter for parsing haskell.

So far, I have just set up a vite project that imports and inits `web-tree-sitter`, which works after

- <https://github.com/tree-sitter/tree-sitter/issues/2831>
- <https://github.com/tree-sitter/tree-sitter/pull/2830>

Running:

```sh
cd haskell && pnpm i
pnpm dev
```

will start the vite dev server, loading tree sitter on `http://localhost:5174/`.

The next step is be to generate `tree-sitter-haskell.wasm` file following <https://www.npmjs.com/package/web-tree-sitter#generate-wasm-language-files>.

I've tried to generate it using <https://www.npmjs.com/package/tree-sitter-haskell> but it failed, due to some versioning conflicts involving node / v8 / node-gyp.

It seems a lot of work has gone into this package in <https://github.com/tree-sitter/tree-sitter-haskell/pull/29>, without a new npm package version being released, which is why I've written this comment: <https://github.com/tree-sitter/tree-sitter-haskell/pull/29#issuecomment-1865951565>.

So either someone authorized releases a new version of the package or we might need to pull the changes and try to build it from the tree-sitter master branch.
