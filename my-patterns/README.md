# my-patterns

This directory can be used to save your own patterns.

0. fork and clone the strudel repository
1. run `npm run setup` in the strudel folder
1. Save one or more .txt files in this folder
2. run `npm run repl` in the top-level strudel folder
3. open `http://localhost:3000/my-patterns` !

## deploy

1. in your fork, go to settings -> pages and select "Github Actions" as source
2. edit `website/public/CNAME` to contain `<your-username>.github.io/strudel`
3. edit `website/astro.config.mjs` to use site: `<your-username>.github.io/strudel` and base `/strudel`
4. go to Actions -> "Build and Deploy" and click "Run workflow"
5. view your patterns at `<your-username>.github.io/strudel/my-patterns`
