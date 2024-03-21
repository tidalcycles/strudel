# worker-repl

This is a poc for a more precise version of cyclist, fixing the clock jitter on chrome.
It is also an experiment to use the `worker-timers` lib to test scheduling in inactive windows,
but not the reason why it works. You can comment out the import from `worker-timers` and it still works precisely..

I am not 100% sure why it works + the poc also doesn't implement cps yet..

run it with:

```sh
pnpm i
pnpm dev
```
