# @strudel/sampler

This package allows you to serve your samples on disk to the strudel REPL. 

```sh
cd ~/your/samples/ 
npx @strudel/sampler
```

This will run a server on `http://localhost:5432`. 
You can now load the samples via:

```js
samples('http://localhost:5432')
```
