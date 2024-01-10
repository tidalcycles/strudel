# zig testing ground

<https://dev.to/sleibrock/webassembly-with-zig-part-1-4onm>

```sh
# (re)compile dsp.zig
zig build-lib dsp.zig -target wasm32-freestanding -dynamic -rdynamic
# run server
npx http-server -o
```
