/*
midi.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/midi/midi.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import _WebMidi from 'webmidi';
import { Pattern, isPattern, isNote, getPlayableNoteValue, objectify } from '@strudel.cycles/core';

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
  if (output?.constructor?.name && isPattern(output?.constructor?.name)) {
    throw new Error(
      `.midi does not accept Pattern input. Make sure to pass device name with single quotes. Example: .midi('${
        WebMidi.outputs?.[0]?.name || 'IAC Driver Bus 1'
      }')`,
    );
  }
  return this.onTrigger((time, hap, currentTime) => {
    let note;
    try {
      note = getPlayableNoteValue(hap);
    } catch (err) {
      // dont care if no note is found as we can still send cvs
    }
    const { velocity, nrpnn, nrpv, ccn, ccv, legato, duration: durationValue } = objectify(hap.value);
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
    const deadline = (time - currentTime) * 1000;
    time = WebMidi.time + deadline;
    /* const timingOffset = WebMidi.time - currentTime * 1000;
    time = time * 1000 + timingOffset; */
    const duration = (durationValue ?? hap.duration.valueOf()) * (legato ?? 1) * 1000 - 5;

    if (note) {
      device.playNote(note, channel, {
        time,
        duration,
        velocity,
      });
    }
    if (ccn && ccv) {
      device.sendControlChange(ccn, ccv, channel, { time });
    }
  });
};
