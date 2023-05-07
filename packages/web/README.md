# @strudel/web

This package provides an easy to use bundle of multiple strudel packages for the web.

## Usage

Minimal example:

```js
import '@strudel/web';

document.getElementById('play').addEventListener('click', 
  () => note("c a f e").play()
)
```

As soon as you `import '@strudel/web'`, all strudel functions will be available in the global scope.
In this case, we are using `note` to create a pattern.
To actually play the pattern, you have to append `.play()` to the end.

Note: Due to the [Autoplay policy](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy), you can only play audio in a browser after a click event.

### Loading samples

By default, no external samples are loaded, but you can add them like this:

```js
import { prebake } from '@strudel/web';

prebake(() => samples('github:tidalcycles/Dirt-Samples/master'))

document.getElementById('play').addEventListener('click', 
  () => s("bd sd").play()
)
```

You can learn [more about the `samples` function here](https://strudel.tidalcycles.org/learn/samples#loading-custom-samples).

### Evaluating Code

Instead of creating patterns directly in JS, you might also want to take in user input and turn that into a pattern.
This is called evaluation: Taking a piece of code and executing it on the fly.

To do that, you can use the `evaluate` function:

```js
import '@strudel/web';

document.getElementById('play').addEventListener('click', 
  () => evaluate('note("c a f e").jux(rev)')
);
```
