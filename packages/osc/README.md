# @strudel/osc

OSC output for strudel patterns! Currently only tested with super collider / super dirt.

## Usage

OSC will only work if you run the REPL locally + the OSC server besides it:

From the project root:

```js
npm run repl
```

and in a seperate shell:

```js
npm run osc
```

This should give you

```log
osc client running on port 57120
osc server running on port 57121
websocket server running on port 8080
```

Now open Supercollider (with the super dirt startup file)

Now open the REPL and type:

```js
s("<bd sd> hh").osc()
```

or just [click here](https://strudel.cc/#cygiPGJkIHNkPiBoaCIpLm9zYygp)...

You can read more about [how to use Superdirt with Strudel the Tutorial](https://strudel.cc/learn/input-output/#superdirt-api)
