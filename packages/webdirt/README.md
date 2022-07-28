# @strudel.cycles/webdirt

This package adds [webdirt](https://github.com/dktr0/WebDirt) support to strudel!

## Dev Notes

Add default samples to repl:

1. move samples to `repl/public/samples` folder. the samples folder is expected to have subfolders, with samples in it. the subfolders will be the names of the samples.
2. run `./makeSampleMap.sh ../../repl/public/samples/EmuSP12 > ../../repl/public/samples/EmuSP12.json`
3. adapt `loadWebDirt` in App.jsx + MiniRepl.jsx to use the generated json file
