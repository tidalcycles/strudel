# mondo

a lisp-based language intended to be used as a custom dsl for patterns that can stand on its own feet. 
see the `test` folder for usage examples

more info:

- [uzulang I](https://garten.salat.dev/uzu/uzulang1.html)
- [uzulang II](https://garten.salat.dev/uzu/uzulang2.html)

## Example Usage

```js
import { MondoRunner } from 'mondolang'
// define our library of functions and variables
let lib = {
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
  PI: Math.PI,
};
// this function will evaluate nodes in the syntax tree
function evaluator(node) {
  // check if node is a leaf node (!= list)
  if (node.type !== 'list') {
    // check lib if we find a match in the lib, otherwise return value
    return lib[node.value] ?? node.value;
  }
  // now it can only be a list..
  const [fn, ...args] = node.children;
  // children in a list will already be evaluated
  // the first child is expected to be a function
  if (typeof fn !== 'function') {
    throw new Error(`"${fn}" is not a function`);
  }
  return fn(...args);
}
const runner = new MondoRunner({ evaluator });
const pat = runner.run('add 1 (mul 2 PI)') // 7.283185307179586
```
