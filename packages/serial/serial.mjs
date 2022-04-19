import { Pattern, isPattern } from '@strudel.cycles/core';

var serialWriter;
var choosing = false;

export async function getWriter() {
  if (choosing) {
    return;
  }
  choosing = true;
  if (serialWriter) {
    return serialWriter;
  }
  if ('serial' in navigator) {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    const writer = textEncoder.writable.getWriter();
    serialWriter = function (message) {
      writer.write(message)
    }
  }
  else {
    throw('Webserial is not available in this browser.')
  }
}

const latency = 0.1;

// Pattern.prototype.midi = function (output: string | number, channel = 1) {
Pattern.prototype.serial = function () {
  return this._withEvent((event) => {
    getWriter();
    if (!serialWriter) {
      return event;
    }
    const onTrigger = (time, event, currentTime) => {
      var message = "";
      if (typeof event.value === 'object') {
        for (const [key, val] of Object.entries(event.value).flat()) {
          message += `${key}:${val};`
        }
      }
      else {
        message = event.value;
      }
      const offset = (time - currentTime + latency) * 1000;
      //const ts = Math.floor(Date.now() + offset);
      console.log(`sending ${message}`)
      window.setTimeout(serialWriter, offset, message)
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};
