/*
midi.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/midi/midi.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern } from '@strudel.cycles/core';
import * as _WebMidi from 'webmidi';
import { isPattern, logger } from '@strudel.cycles/core';
import { noteToMidi } from '@strudel.cycles/core';
import { Note } from 'webmidi';
// if you use WebMidi from outside of this package, make sure to import that instance:
export const { WebMidi } = _WebMidi;

function supportsMidi() {
  return typeof navigator.requestMIDIAccess === 'function';
}

function getMidiDeviceNamesString(outputs) {
  return outputs.map((o) => `'${o.name}'`).join(' | ');
}

function enableWebMidi(options = {}) {
  const { onReady, onConnected, onDisconnected, onEnabled } = options;
  if (WebMidi.enabled) {
    return;
  }
  if (!supportsMidi()) {
    throw new Error('Your Browser does not support WebMIDI.');
  }
  WebMidi.addListener('connected', () => {
    onConnected?.(WebMidi);
  });
  WebMidi.addListener('enabled', () => {
    onEnabled?.(WebMidi);
  });
  // Reacting when a device becomes unavailable
  WebMidi.addListener('disconnected', (e) => {
    onDisconnected?.(WebMidi, e);
  });
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
      onReady?.(WebMidi);
      resolve(WebMidi);
    });
  });
}
// const outputByName = (name: string) => WebMidi.getOutputByName(name);
const outputByName = (name) => WebMidi.getOutputByName(name);

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
  // attempt to default to first IAC device if none is specified
  const IACOutput = outputs.find((output) => output.name.includes('IAC'));
  const device = IACOutput ?? outputs[0];
  if (!device) {
    throw new Error(
      `🔌 MIDI device '${output ? output : ''}' not found. Use one of ${getMidiDeviceNamesString(WebMidi.outputs)}`,
    );
  }

  return IACOutput ?? outputs[0];
}

Pattern.prototype.midi = function (output) {
  if (isPattern(output)) {
    throw new Error(
      `.midi does not accept Pattern input. Make sure to pass device name with single quotes. Example: .midi('${
        WebMidi.outputs?.[0]?.name || 'IAC Driver Bus 1'
      }')`,
    );
  }

  enableWebMidi({
    onEnabled: ({ outputs }) => {
      const device = getDevice(output, outputs);
      const otherOutputs = outputs.filter((o) => o.name !== device.name);
      logger(
        `Midi enabled! Using "${device.name}". ${
          otherOutputs?.length ? `Also available: ${getMidiDeviceNamesString(otherOutputs)}` : ''
        }`,
      );
    },
    onDisconnected: ({ outputs }) =>
      logger(`Midi device disconnected! Available: ${getMidiDeviceNamesString(outputs)}`),
  });

  return this.onTrigger((time, hap, currentTime, cps) => {
    if (!WebMidi.enabled) {
      return;
    }
    const device = getDevice(output, WebMidi.outputs);
    hap.ensureObjectValue();

    const offset = (time - currentTime) * 1000;
    // passing a string with a +num into the webmidi api adds an offset to the current time https://webmidijs.org/api/classes/Output
    const timeOffsetString = `+${offset}`;

    // destructure value
    const { note, nrpnn, nrpv, ccn, ccv, midichan = 1 } = hap.value;
    const velocity = hap.context?.velocity ?? 0.9; // TODO: refactor velocity

    // note off messages will often a few ms arrive late, try to prevent glitching by subtracting from the duration length
    const duration = Math.floor(hap.duration.valueOf() * 1000 - 10);
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
