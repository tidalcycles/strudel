# @strudel.cycles/tauri

Rust source files for building native desktop apps using Tauri

## Usage

- Install [Rust](https://rustup.rs/) on your system.
- Install `cmake` on your system. OSX: `brew install cmake`, Linux: `sudo apt-get install cmake`

From the project root:

- install Strudel dependencies

```js
pnpm i
```

- to run Strudel for development

```js
pnpm tauri dev
```

- to build the binary and installer/bundle

```js
pnpm tauri build
```

The binary and installer can be found in the 'src-tauri/target/release/bundle' directory
