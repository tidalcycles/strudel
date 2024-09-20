/*
midi.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/midi/midi.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as _WebMidi from 'webmidi';
import { Pattern, getEventOffsetMs, isPattern, logger, ref } from '@strudel/core';
import { noteToMidi } from '@strudel/core';
import { Note } from 'webmidi';
// if you use WebMidi from outside of this package, make sure to import that instance:
export const { WebMidi } = _WebMidi;

function supportsMidi() {
  return typeof navigator.requestMIDIAccess === 'function';
}

function getMidiDeviceNamesString(devices) {
  return devices.map((o) => `'${o.name}'`).join(' | ');
}

export function enableWebMidi(options = {}) {
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

function getDevice(indexOrName, devices) {
  if (!devices.length) {
    throw new Error(`🔌 No MIDI devices found. Connect a device or enable IAC Driver.`);
  }
  if (typeof indexOrName === 'number') {
    return devices[indexOrName];
  }
  const byName = (name) => devices.find((output) => output.name.includes(name));
  if (typeof indexOrName === 'string') {
    return byName(indexOrName);
  }
  // attempt to default to first IAC device if none is specified
  const IACOutput = byName('IAC');
  const device = IACOutput ?? devices[0];
  if (!device) {
    throw new Error(
      `🔌 MIDI device '${device ? device : ''}' not found. Use one of ${getMidiDeviceNamesString(devices)}`,
    );
  }

  return IACOutput ?? devices[0];
}

// send start/stop messages to outputs when repl starts/stops
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    if (!WebMidi?.enabled) {
      return;
    }
    if (e.data === 'strudel-stop') {
      WebMidi.outputs.forEach((output) => output.sendStop());
    }
    // cannot start here, since we have no timing info, see sendStart below
  });
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

  return this.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    if (!WebMidi.enabled) {
      console.log('not enabled');
      return;
    }
    const device = getDevice(output, WebMidi.outputs);
    hap.ensureObjectValue();
    //magic number to get audio engine to line up, can probably be calculated somehow
    const latencyMs = 34;
    // passing a string with a +num into the webmidi api adds an offset to the current time https://webmidijs.org/api/classes/Output
    const timeOffsetString = `+${getEventOffsetMs(targetTime, currentTime) + latencyMs}`;
    // destructure value
    let { note, nrpnn, nrpv, ccn, ccv, midichan = 1, midicmd, gain = 1, velocity = 0.9 } = hap.value;

    velocity = gain * velocity;

    // note off messages will often a few ms arrive late, try to prevent glitching by subtracting from the duration length
    const duration = (hap.duration.valueOf() / cps) * 1000 - 10;
    if (note != null) {
      const midiNumber = typeof note === 'number' ? note : noteToMidi(note);
      const midiNote = new Note(midiNumber, { attack: velocity, duration });
      device.playNote(midiNote, midichan, {
        time: timeOffsetString,
      });
    }
    if (ccv !== undefined && ccn !== undefined) {
      if (typeof ccv !== 'number' || ccv < 0 || ccv > 1) {
        throw new Error('expected ccv to be a number between 0 and 1');
      }
      if (!['string', 'number'].includes(typeof ccn)) {
        throw new Error('expected ccn to be a number or a string');
      }
      const scaled = Math.round(ccv * 127);
      device.sendControlChange(ccn, scaled, midichan, { time: timeOffsetString });
    }
    if (hap.whole.begin + 0 === 0) {
      // we need to start here because we have the timing info
      device.sendStart({ time: timeOffsetString });
    }
    if (['clock', 'midiClock'].includes(midicmd)) {
      device.sendClock({ time: timeOffsetString });
    } else if (['start'].includes(midicmd)) {
      device.sendStart({ time: timeOffsetString });
    } else if (['stop'].includes(midicmd)) {
      device.sendStop({ time: timeOffsetString });
    } else if (['continue'].includes(midicmd)) {
      device.sendContinue({ time: timeOffsetString });
    }
  });
};

let listeners = {};
const refs = {};

export async function midin(input) {
  if (isPattern(input)) {
    throw new Error(
      `midin: does not accept Pattern as input. Make sure to pass device name with single quotes. Example: midin('${
        WebMidi.outputs?.[0]?.name || 'IAC Driver Bus 1'
      }')`,
    );
  }
  const initial = await enableWebMidi(); // only returns on first init
  const device = getDevice(input, WebMidi.inputs);
  if (!device) {
    throw new Error(
      `midiin: device "${input}" not found.. connected devices: ${getMidiDeviceNamesString(WebMidi.inputs)}`,
    );
  }
  if (initial) {
    const otherInputs = WebMidi.inputs.filter((o) => o.name !== device.name);
    logger(
      `Midi enabled! Using "${device.name}". ${
        otherInputs?.length ? `Also available: ${getMidiDeviceNamesString(otherInputs)}` : ''
      }`,
    );
    refs[input] = {};
  }
  const cc = (cc) => ref(() => refs[input][cc] || 0);

  listeners[input] && device.removeListener('midimessage', listeners[input]);
  listeners[input] = (e) => {
    const cc = e.dataBytes[0];
    const v = e.dataBytes[1];
    refs[input] && (refs[input][cc] = v / 127);
  };
  device.addListener('midimessage', listeners[input]);
  return cc;
}
