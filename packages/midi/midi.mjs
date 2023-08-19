/*
midi.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/midi/midi.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as _WebMidi from 'webmidi';
import { Pattern, isPattern, logger } from '@strudel.cycles/core';
import { noteToMidi } from '@strudel.cycles/core';
import { Note } from 'webmidi';

// if you use WebMidi from outside of this package, make sure to import that instance:
export const { WebMidi } = _WebMidi;

function supportsMidi() {
  return typeof navigator.requestMIDIAccess === 'function';
}

export function enableWebMidi(options = {}) {
  const { onReady, onConnected, onDisconnected } = options;

  if (!supportsMidi()) {
    throw new Error('Your Browser does not support WebMIDI.');
  }
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
      WebMidi.addListener('connected', (e) => {
        onConnected?.(WebMidi);
      });
      // Reacting when a device becomes unavailable
      WebMidi.addListener('disconnected', (e) => {
        onDisconnected?.(WebMidi, e);
      });
      onReady?.(WebMidi);
      resolve(WebMidi);
    });
  });
}
// const outputByName = (name: string) => WebMidi.getOutputByName(name);
const outputByName = (name) => WebMidi.getOutputByName(name);

let midiReady = false;
let prevTime = 0;

// output?: string | number, outputs: typeof WebMidi.outputs
function getDevice(output, outputs) {
  if (!outputs.length) {
    throw new Error(`🔌 No MIDI devices found. Connect a device or enable IAC Driver.`);
  }
  if (typeof output === 'number') {
    return outputs[output];
  }
  if (typeof output === 'string') {
    return outputByName(output);
  }
  // attempt to default to IAC device if none is specified
  const IACOutput = outputs.find((output) => output.name.includes('IAC'));
  return IACOutput ?? outputs[0];
}

// Pattern.prototype.midi = function (output: string | number, channel = 1) {
Pattern.prototype.midi = function (output) {
  if (!supportsMidi()) {
    throw new Error(`🎹 WebMidi is not enabled. Supported Browsers: https://caniuse.com/?search=webmidi`);
  }
  if (isPattern(output)) {
    throw new Error(
      `.midi does not accept Pattern input. Make sure to pass device name with single quotes. Example: .midi('${
        WebMidi.outputs?.[0]?.name || 'IAC Driver Bus 1'
      }')`,
    );
  }

  if (midiReady === false) {
    enableWebMidi({
      onConnected: ({ outputs }) => {
        const device = getDevice(output, outputs);
        const otherOutputs = outputs
          .filter((o) => o.name !== device.name)
          .map((o) => `'${o.name}'`)
          .join(' | ');

        midiReady = true;
        logger(`Midi connected! Using "${device.name}". ${otherOutputs ? `Also available: ${otherOutputs}` : ''}`);
      },
      onDisconnected: ({ outputs }) =>
        logger(`Midi device disconnected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`),
    });
  }

  return this.onTrigger((time, hap, currentTime, cps = 1) => {
    if (!midiReady) {
      return;
    }

    const device = getDevice(output, WebMidi.outputs);
    const current = performance.now();
    // console.log(current - prevTime);
    prevTime = current;

    if (!device) {
      throw new Error(
        `🔌 MIDI device '${output ? output : ''}' not found. Use one of ${WebMidi.outputs
          .map((o) => `'${o.name}'`)
          .join(' | ')}`,
      );
    }
    hap.ensureObjectValue();

    const offset = (time - currentTime) * 1000;

    // passing a string with a +num into the webmidi api adds an offset to the current time https://webmidijs.org/api/classes/Output
    const timeOffsetString = `+${offset}`;

    // destructure value
    const { note, nrpnn, nrpv, ccn, ccv, midichan = 1 } = hap.value;
    const velocity = hap.context?.velocity ?? 0.9; // TODO: refactor velocity
    const duration = Math.round(hap.duration.valueOf() * 1000 - 5);

    if (note != null) {
      const midiNumber = typeof note === 'number' ? note : noteToMidi(note);
      const midiNote = new Note(midiNumber, { attack: velocity, duration });
      device.playNote(midiNote, midichan, {
        time: timeOffsetString,
      });
    }
    if (ccv && ccn) {
      if (typeof ccv !== 'number' || ccv < 0 || ccv > 1) {
        throw new Error('expected ccv to be a number between 0 and 1');
      }
      if (!['string', 'number'].includes(typeof ccn)) {
        throw new Error('expected ccn to be a number or a string');
      }
      const scaled = Math.round(ccv * 127);
      device.sendControlChange(ccn, scaled, midichan, { time: timeOffsetString });
    }
  });
};
