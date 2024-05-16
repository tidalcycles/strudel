# @strudel/webaudio

This package contains helpers to make music with strudel and the Web Audio API.
It is a thin binding to [superdough](https://www.npmjs.com/package/superdough).

## Install

```sh
npm i @strudel/webaudio --save
```

## Example

```js
import { repl, note } from "@strudel/core";
import { initAudioOnFirstClick, getAudioContext, webaudioOutput } from "@strudel/webaudio";

initAudioOnFirstClick();
const ctx = getAudioContext();

const { scheduler } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime
});

const pattern = note("c3", ["eb3", "g3"]).s("sawtooth");

scheduler.setPattern(pattern);
document.getElementById("start").addEventListener("click", () => scheduler.start());
document.getElementById("stop").addEventListener("click", () => scheduler.stop());
```

[Play with the example codesandbox](https://codesandbox.io/s/amazing-dawn-gclfwg?file=/src/index.js).

Read more in the docs about [samples](https://strudel.cc/learn/samples/), [synths](https://strudel.cc/learn/synths/) and [effects](https://strudel.cc/learn/effects/).
