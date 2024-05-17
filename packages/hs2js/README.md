# hs2js

Experimental haskell in javascript interpreter.

## Usage

### Via Script Tag

You can load the library directly from a script tag via unpkg:

```html
<script src="https://unpkg.com/hs2js@0.0.3"></script>
<button id="hello">hello</button>
<script>
  hs2js.setBase('https://unpkg.com/hs2js@0.0.3/dist/');
  hs2js.loadParser();
  document.getElementById('hello').addEventListener('click', () => {
    hs2js.evaluate('alert "hello from haskell!"');
  });
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
