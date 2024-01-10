# zig testing ground

<https://dev.to/sleibrock/webassembly-with-zig-part-1-4onm>

```sh
# (re)compile add.zig
zig build-lib add.zig -target wasm32-freestanding -dynamic -rdynamic
# run server
npx http-server -o
```
