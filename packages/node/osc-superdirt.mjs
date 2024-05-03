import { createClock, evalScope } from '@strudel/core';
import { evaluate } from '@strudel/transpiler';
import OSC from 'osc-js';
import watch from 'node-watch';
import fs from 'node:fs/promises';

const config = {
  receiver: 'udp', // @param {string} Where messages sent via 'send' method will be delivered to, 'ws' for Websocket clients, 'udp' for udp client
  open: {
    host: 'localhost', // @param {string} Hostname of udp server to bind to
    port: 57121, // @param {number} Port of udp client for messaging
    // enabling the following line will receive tidal messages:
    // port: 57120, // @param {number} Port of udp client for messaging
    exclusive: false, // @param {boolean} Exclusive flag
  },
  send: {
    host: 'localhost', // @param {string} Hostname of udp client for messaging
    port: 57120, // @param {number} Port of udp client for messaging
  },
};

const osc = new OSC({ plugin: new OSC.DatagramPlugin(config) });

osc.open(); // start a WebSocket server on port 8080

console.log('osc client running on port', config.open.port);
console.log('osc server running on port', config.send.port);

let file = 'pattern.mjs';
let pattern;
async function evaluateFile() {
  try {
    console.log('// file evaluated:');
    const code = await fs.readFile(file, { encoding: 'utf8' });
    console.log(code);
    const res = await evaluate(code);
    pattern = res.pattern;
  } catch (err) {
    console.error(err);
  }
}

const getTime = () => performance.now() / 1000;
async function main() {
  await evalScope(import('@strudel/core'), import('@strudel/mini'), import('@strudel/tonal'));
  await evaluateFile();
  watch(file, { recursive: true }, () => evaluateFile());
  let lastEnd;
  let minLatency = 50;
  const clock = createClock(getTime, (phase) => {
    if (!lastEnd) {
      lastEnd = phase;
      return;
    }
    const haps = pattern.queryArc(lastEnd, phase);
    lastEnd = phase;
    const cps = 1;
    const cycle = Math.floor(phase);
    haps
      .filter((h) => h.hasOnset())
      .forEach((hap) => {
        const delta = hap.duration.valueOf();
        const controls = Object.assign({}, { cps, cycle, delta }, hap.value);
        const keyvals = Object.entries(controls).flat();
        const ts = Math.floor(performance.timeOrigin + hap.whole.begin * 1000 + minLatency);
        const message = new OSC.Message('/dirt/play', ...keyvals);
        const bundle = new OSC.Bundle([message], ts);
        bundle.timestamp(ts); // workaround for https://github.com/adzialocha/osc-js/issues/60
        osc.send(bundle);
      });
  });

  clock.start();
}

main();
