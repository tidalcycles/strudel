/*
serial.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/serial/serial.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, isPattern } from '@strudel/core';

var writeMessagers = {};
var choosing = false;

export async function getWriter(name, br) {
  if (choosing) {
    return;
  }
  choosing = true;
  if (name in writeMessagers) {
    return writeMessagers[name];
  }
  if ('serial' in navigator) {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: br });
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    writeMessagers[name] = function (message, chk) {
      const encoded = encoder.encode(message);
      if (!chk) {
        writer.write(encoded);
      } else {
        const bytes = new Uint8Array(4);
        bytes[0] = 124; // | symbol
        bytes[1] = (chk >> 8) & 0xff;
        bytes[2] = chk & 0xff;
        bytes[3] = 59; // semicolon
        const withchk = new Uint8Array(encoded.length + 4);
        withchk.set(encoded);
        withchk.set(bytes, encoded.length);
        writer.write(withchk);
      }
    };
  } else {
    throw 'Webserial is not available in this browser.';
  }
}

const latency = 0.1;

// crc16 (CCITT-FALSE) https://gist.github.com/tijnkooijmans/10981093
function crc16(data) {
  const length = data.length;
  if (length == 0) {
    return 0;
  }

  var crc = 0xffff;
  for (var i = 0; i < length; ++i) {
    crc ^= data.charCodeAt(i) << 8;
    for (var j = 0; j < 8; ++j) {
      crc = (crc & 0x8000) > 0 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }

  return crc & 0xffff;
}

Pattern.prototype.serial = function (br = 115200, sendcrc = false, singlecharids = false, name = 'default') {
  return this.withHap((hap) => {
    if (!(name in writeMessagers)) {
      getWriter(name, br);
    }
    const onTrigger = (t_deprecate, hap, currentTime, cps, targetTime) => {
      var message = '';
      var chk = 0;
      if (typeof hap.value === 'object') {
        if ('action' in hap.value) {
          var action = hap.value['action'];
          if (singlecharids) {
            action = action.charAt(0);
          }
          message += action + '(';
          var first = true;
          for (var [key, val] of Object.entries(hap.value)) {
            if (key === 'action') {
              continue;
            }
            if (first) {
              first = false;
            } else {
              message += ',';
            }
            if (singlecharids) {
              key = key.charAt(0);
            }
            message += key + ':' + val;
          }
          message += ')';
          if (sendcrc) {
            chk = crc16(message);
          }
        } else {
          for (const [key, val] of Object.entries(hap.value)) {
            message += `${key}:${val}`;
          }
        }
      } else {
        message = hap.value;
      }
      const offset = (targetTime - currentTime + latency) * 1000;

      window.setTimeout(function () {
        writeMessagers[name](message, chk);
      }, offset);
    };
    return hap.setContext({ ...hap.context, onTrigger, dominantTrigger: true });
  });
};
