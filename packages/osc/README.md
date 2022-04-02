# @strudel.cycles/osc

OSC messaging between strudel and super collider?

## Sniffing Tidal Messages

```sh
npm run tidal-sniffer
```

Now open a .tidal file and play something. There should be logs like:

```log
received: /dirt/play [
  '_id_',   '1',
  'cps',    0.5625,
  'cutoff', 100,
  'cycle',  724.1875,
  'delta',  0.11111068725585938,
  'orbit',  0,
  's',      'arpy'
]
```

## Web Client + Server (WIP)

```sh
npm run client
npm run server # another terminal
```

Then go to [http://localhost:4321](localhost:4321) and push the button.
In your server terminal, there should be a log.
