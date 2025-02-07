/*
midi.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/midi/midi.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as _WebMidi from 'webmidi';
import { Pattern, getEventOffsetMs, isPattern, logger, ref } from '@strudel/core';
import { noteToMidi, getControlName } from '@strudel/core';
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

// registry for midi mappings, converting control names to cc messages
export const midicontrolMap = new Map();

// takes midimap and converts each control key to the main control name
function unifyMapping(mapping) {
  return Object.fromEntries(
    Object.entries(mapping).map(([key, mapping]) => {
      if (typeof mapping === 'number') {
        mapping = { ccn: mapping };
      }
      return [getControlName(key), mapping];
    }),
  );
}

function githubPath(base, subpath = '') {
  if (!base.startsWith('github:')) {
    throw new Error('expected "github:" at the start of pseudoUrl');
  }
  let [_, path] = base.split('github:');
  path = path.endsWith('/') ? path.slice(0, -1) : path;
  if (path.split('/').length === 2) {
    // assume main as default branch if none set
    path += '/main';
  }
  return `https://raw.githubusercontent.com/${path}/${subpath}`;
}

/**
 * configures the default midimap, which is used when no "midimap" port is set
 * @example
 * defaultmidimap({ lpf: 74 })
 * $: note("c a f e").midi();
 * $: lpf(sine.slow(4).segment(16)).midi();
 */
export function defaultmidimap(mapping) {
  midicontrolMap.set('default', unifyMapping(mapping));
}

let loadCache = {};

/**
 * Adds midimaps to the registry. Inside each midimap, control names (e.g. lpf) are mapped to cc numbers.
 * @example
 * midimaps({ mymap: { lpf: 74 } })
 * $: note("c a f e")
 * .lpf(sine.slow(4))
 * .midimap('mymap')
 * .midi()
 * @example
 * midimaps({ mymap: {
 *   lpf: { ccn: 74, min: 0, max: 20000, exp: 0.5 }
 * }})
 * $: note("c a f e")
 * .lpf(sine.slow(2).range(400,2000))
 * .midimap('mymap')
 * .midi()
 */
export async function midimaps(map) {
  if (typeof map === 'string') {
    if (map.startsWith('github:')) {
      map = githubPath(map, 'midimap.json');
    }
    if (!loadCache[map]) {
      loadCache[map] = fetch(map).then((res) => res.json());
    }
    map = await loadCache[map];
  }
  if (typeof map === 'object') {
    Object.entries(map).forEach(([name, mapping]) => midicontrolMap.set(name, unifyMapping(mapping)));
  }
}

// registry for midi sounds, converting sound names to controls
export const midisoundMap = new Map();

// normalizes the given value from the given range and exponent
function normalize(value = 0, min = 0, max = 1, exp = 1) {
  if (min === max) {
    throw new Error('min and max cannot be the same value');
  }
  let normalized = (value - min) / (max - min);
  normalized = Math.min(1, Math.max(0, normalized));
  return Math.pow(normalized, exp);
}
function mapCC(mapping, value) {
  return Object.keys(value)
    .filter((key) => !!mapping[getControlName(key)])
    .map((key) => {
      const { ccn, min = 0, max = 1, exp = 1 } = mapping[key];
      const ccv = normalize(value[key], min, max, exp);
      return { ccn, ccv };
    });
}

// sends a cc message to the given device on the given channel
function sendCC(ccn, ccv, device, midichan, timeOffsetString) {
  if (typeof ccv !== 'number' || ccv < 0 || ccv > 1) {
    throw new Error('expected ccv to be a number between 0 and 1');
  }
  if (!['string', 'number'].includes(typeof ccn)) {
    throw new Error('expected ccn to be a number or a string');
  }
  const scaled = Math.round(ccv * 127);
  device.sendControlChange(ccn, scaled, midichan, { time: timeOffsetString });
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
    hap.ensureObjectValue();
    //magic number to get audio engine to line up, can probably be calculated somehow
    const latencyMs = 34;
    // passing a string with a +num into the webmidi api adds an offset to the current time https://webmidijs.org/api/classes/Output
    const timeOffsetString = `+${getEventOffsetMs(targetTime, currentTime) + latencyMs}`;

    // destructure value
    let {
      note,
      ccn,
      ccv,
      midichan = 1,
      midicmd,
      gain = 1,
      velocity = 0.9,
      midimap = 'default',
      midiport = output,
    } = hap.value;

    const device = getDevice(midiport, WebMidi.outputs);
    if (!device) {
      logger(
        `[midi] midiport "${midiport}" not found! available: ${WebMidi.outputs.map((output) => `'${output.name}'`).join(', ')}`,
      );
      return;
    }

    velocity = gain * velocity;
    // if midimap is set, send a cc messages from defined controls
    if (midicontrolMap.has(midimap)) {
      const ccs = mapCC(midicontrolMap.get(midimap), hap.value);
      ccs.forEach(({ ccn, ccv }) => sendCC(ccn, ccv, device, midichan, timeOffsetString));
    }

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
      sendCC(ccn, ccv, device, midichan, timeOffsetString);
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
