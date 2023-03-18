# @strudel.cycles/link

This is an experiment to find out how to hook up ableton link with strudel.

## Usage

```sh
cd packages/link/ && npm i
node link-server.mjs # tested with node 18
```

This will play the pattern in `link-server.mjs`, which will be synced automatically via Ableton Link!

## Notes

- The sound generation uses [node-web-audio-api](https://github.com/audiojs/web-audio-api), supporting only oscillators with a fixed envelope
  - All functions from `@strudel.cycles/webaudio` could be supported when the [node-webaudio branch](https://github.com/tidalcycles/strudel/tree/node-webaudio) is further developed. This includes refactoring the webaudio stuff to allow passing an audio context + making sure it can be imported in node
- To make this live codable, I see 2 options:
  - headless: add an express server (or similar) that allows sending `PUT` requests to change the pattern.
  - browser: find a way combine the REPL with the ableton clock.
    - the server could pass the callback from ableton link via http or websocket
    - the client could then use these messages to control the scheduler
      - could try implementing getTime as a LERP between received beat values
      - or do not use the scheduler and just query within the received beat values
    - highlighting is another thing..