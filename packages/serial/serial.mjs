import { Pattern, isPattern } from '@strudel.cycles/core';

var serialWriter;
var choosing = false;

export async function getWriter(br=115200) {
  if (choosing) {
    return;
  }
  choosing = true;
  if (serialWriter) {
    return serialWriter;
  }
  if ('serial' in navigator) {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: br });
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
Pattern.prototype.serial = async function (...args) {
  return this._withEvent((event) => {
    if (!serialWriter) {
      getWriter(...args);
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
      window.setTimeout(serialWriter, offset, message);
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};
