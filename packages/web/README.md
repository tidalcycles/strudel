# @strudel/web

This package provides an easy to use bundle of multiple strudel packages for the web.

## Usage

```js
import { repl } from '@strudel/web';

const strudel = repl();

document.getElementById('play').addEventListener('click', 
  () => strudel.evaluate('note("c a f e").jux(rev)')
);
```

Note: Due to the [Autoplay policy](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy), you can only play audio in a browser after a click event.

### Loading samples

By default, no external samples are loaded, but you can add them like this:

```js
import { repl, samples } from '@strudel/web';

const strudel = repl({
  prebake: () => samples('github:tidalcycles/Dirt-Samples/master'),
});

document.getElementById('play').addEventListener('click', 
  () => strudel.evaluate('s("bd,jvbass(3,8)").jux(rev)')
);
```

You can learn [more about the `samples` function here](https://strudel.tidalcycles.org/learn/samples#loading-custom-samples).
