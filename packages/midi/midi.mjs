import { isNote } from 'tone';
import _WebMidi from 'webmidi';
import { Pattern, isPattern } from '@strudel.cycles/core/strudel.mjs';
import { Tone } from '@strudel.cycles/tone';

// if you use WebMidi from outside of this package, make sure to import that instance:
export const WebMidi = _WebMidi;

export function enableWebMidi() {
  return new Promise((resolve, reject) => {
    if (WebMidi.enabled) {
      // if already enabled, just resolve WebMidi
      resolve(WebMidi);
      return;
    }
    WebMidi.enable((err) => {
      if (err) {
        reject(err);
      }
      resolve(WebMidi);
    });
  });
}
// const outputByName = (name: string) => WebMidi.getOutputByName(name);
const outputByName = (name) => WebMidi.getOutputByName(name);

// Pattern.prototype.midi = function (output: string | number, channel = 1) {
Pattern.prototype.midi = function (output, channel = 1) {
  if (isPattern(output?.constructor?.name)) {
    throw new Error(
      `.midi does not accept Pattern input. Make sure to pass device name with single quotes. Example: .midi('${
        WebMidi.outputs?.[0]?.name || 'IAC Driver Bus 1'
      }')`,
    );
  }
  return this._withEvent((event) => {
    // const onTrigger = (time: number, event: any) => {
    const onTrigger = (time, event) => {
      let note = event.value;
      const velocity = event.context?.velocity ?? 0.9;
      if (!isNote(note)) {
        throw new Error('not a note: ' + note);
      }
      if (!WebMidi.enabled) {
        throw new Error(`🎹 WebMidi is not enabled. Supported Browsers: https://caniuse.com/?search=webmidi`);
      }
      if (!WebMidi.outputs.length) {
        throw new Error(`🔌 No MIDI devices found. Connect a device or enable IAC Driver.`);
      }
      let device;
      if (typeof output === 'number') {
        device = WebMidi.outputs[output];
      } else if (typeof output === 'string') {
        device = outputByName(output);
      } else {
        device = WebMidi.outputs[0];
      }
      if (!device) {
        throw new Error(
          `🔌 MIDI device '${output ? output : ''}' not found. Use one of ${WebMidi.outputs
            .map((o) => `'${o.name}'`)
            .join(' | ')}`,
        );
      }
      // console.log('midi', value, output);
      const timingOffset = WebMidi.time - Tone.getContext().currentTime * 1000;
      time = time * 1000 + timingOffset;
      // const inMs = '+' + (time - Tone.getContext().currentTime) * 1000;
      // await enableWebMidi()
      device.playNote(note, channel, {
        time,
        duration: event.duration * 1000 - 5,
        velocity,
      });
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};
