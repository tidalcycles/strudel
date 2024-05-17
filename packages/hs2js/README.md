# hs2js

Experimental haskell in javascript interpreter. Many haskell features are not implemented.
This projects mainly exists to be able to write and interpret [Tidal Cycles](https://tidalcycles.org/) code in the browser,
as part of [Strudel](https://github.com/tidalcycles/strudel). This project could only exist thanks to [tree-sitter-haskell](https://github.com/tree-sitter/tree-sitter-haskell).

## Installation

### Via Script Tag

You can load the library directly from a script tag via unpkg:

```html
<script src="https://unpkg.com/hs2js@0.0.3"></script>
<button id="hello">hello</button>
<script>
  hs2js.setBase('https://unpkg.com/hs2js@0.0.3/dist/');
  hs2js.loadParser().then(()=>{
    document.getElementById('hello').addEventListener('click', () => {
      hs2js.evaluate('alert "hello from haskell!"');
    });
  })
</script>
```

### Via npm

You need to add `postinstall` to your `package.json` script to copy the parser to your `public` folder:

```json
{
  "scripts": {
    "postinstall": "cp node_modules/hs2js/dist/tree-sitter.wasm public && cp node_modules/hs2js/dist/tree-sitter-haskell.wasm public"
  }
}
```

Depending on your setup, replace `public` with the folder that will serve your assets to `/`. Then install the package:

```sh
npm i hs2js
```

and use it:

```js
import * as hs2js from 'hs2js';
hs2js.loadParser();
document.getElementById('hello').addEventListener('click', () => {
  hs2js.evaluate('alert "hello from haskell!"');
});
```

## API

These are all functions exported by the package:

### evaluate

Evaluates a piece of haskell code

- `code`: [valid](https://github.com/tree-sitter/tree-sitter-haskell?tab=readme-ov-file#supported-language-extensions) haskell code
- `scope`: global scope, defaults to globalThis. Allows you to pass an object of your own functions / variables from JS to Haskell.
- `ops`: mapping for custom infix operator

Example:

```js
// simple
hs2js.evaluate(`2 + 2`) // = 4
// passing variables via scope:
hs2js.evaluate(`a + b`, { a: 1, b: 2 }) // = 3
// custom operator
hs2js.evaluate(`2 |* 3`, {}, { '|*': (l, r) => l * r }) // = 6
```

### parse

[Parses](https://github.com/tree-sitter/tree-sitter-haskell) a piece of haskell code, returning its AST representation.

Example:

```js
const ast = hs2js.parse(`2 + 2`)
console.log(ast.toString())
// (haskell declarations: (declarations (top_splice (apply function: (variable) argument: (literal (integer))))))
```

### run

Evaluates `rootNode` of haskell AST (used by evaluate internally).

- `rootNode`: haskell AST root node, as returned by `parse`
- `scope`: see evaluate
- `ops`: see evaluate

Example:

```js
const ast = hs2js.parse(`2 + 3`);
const res = hs2js.run(ast.rootNode);
console.log(res); // = 5
```

### loadParser

Loads and caches the parser by fetching `tree-sitter.wasm` and `tree-sitter-haskell.wasm`.
Make sure to call and await this function before calling `parse` or `evaluate`.

```js
hs2js.loadParser().then(() => hs2js.evaluate('alert "ready"'))
```

### setBase

Sets the base path where the WASM files are expected by `loadParser`. Defaults to `/`.
Expects `tree-sitter.wasm` and `tree-sitter-haskell.wasm` to be present.
Can either be a relative path or a URL.

```js
hs2js.setBase('https://unpkg.com/hs2js@0.0.4/dist/');
hs2js.loadParser(); 
/* loads 
- https://unpkg.com/hs2js@0.0.4/dist/tree-sitter.wasm
- https://unpkg.com/hs2js@0.0.4/dist/tree-sitter-haskell.wasm
*/
```
