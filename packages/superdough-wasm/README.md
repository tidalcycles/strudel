# superdough-wasm

This is just a very early experiment to find out how to run wasm in an AudioWorklet.
WASM can be compiled from several languages, which are tested here..

## zig

<https://dev.to/sleibrock/webassembly-with-zig-part-1-4onm>

```sh
# (re)compile dsp.zig
brew install zig # prequisite
cd zigsaw
zig build-lib zigsaw.zig -target wasm32-freestanding -dynamic -rdynamic -O ReleaseSmall # build
npx http-server .. -o # run 
```

wasm file size: 690B

## rust

<https://developer.mozilla.org/en-US/docs/WebAssembly/Rust_to_Wasm>

```sh
# https://www.rust-lang.org/tools/install
cargo install wasm-pack # prequisite
cd rustsaw
wasm-pack build --target bundler # build
npx http-server .. -o # run
```

wasm file size: 653B

## c

<https://emscripten.org/docs/getting_started/Tutorial.html>

```sh
# brew install emscripten
cd csaw
emcc -O2 csaw.c -o csaw # build
npx http-server .. -o
```

wasm file size: 680B

## assemblyscript

<https://www.assemblyscript.org/getting-started.html#setting-up-a-new-project>

```sh
cd ascsaw
# npm i
npm run asbuild # build
```

wasm file size: 122B !
