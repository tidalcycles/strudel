# superdough-wasm

This is just a very early experiment to find out how to run wasm in an AudioWorklet.
WASM can be compiled from several languages, which are tested here..

## zig

<https://dev.to/sleibrock/webassembly-with-zig-part-1-4onm>

```sh
# (re)compile dsp.zig
cd zigsaw
zig build-lib zigsaw.zig -target wasm32-freestanding -dynamic -rdynamic -O ReleaseSmall
# run server
npx http-server .. -o
```

## rust

<https://developer.mozilla.org/en-US/docs/WebAssembly/Rust_to_Wasm>

```sh
# cargo install wasm-pack
cd rustsaw
wasm-pack build --target bundler
npx http-server .. -o
```
