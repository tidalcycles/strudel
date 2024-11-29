/*
mqtt.mjs - for patterning the internet of things from strudel
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/serial/serial.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, isPattern } from '@strudel/core';
import Paho from 'paho-mqtt';

const connections = {};

// Handle connection loss
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.error(' mqtt connection lost: ', responseObject.errorMessage);
  }
}

// Handle received messages
function onMessageArrived(message) {
  console.log('incoming mqtt message: ', message.payloadString); // prettier-ignore
}

function onFailure(err) {
  console.error('Connection failed: ', err);
}

Pattern.prototype.mqtt = function (
  username = undefined,
  password = undefined,
  topic = undefined,
  host = 'wss://localhost:8883/',
  client = undefined,
  latency = 0,
) {
  const key = host + '-' + client;
  let connected = false;
  if (!client) {
    client = 'strudel-' + String(Math.floor(Math.random() * 1000000));
  }
  function onConnect() {
    console.log('Connected to mqtt broker');
    connected = true;
  }

  let cx;
  if (connections[key]) {
    cx = connections[key];
  } else {
    cx = new Paho.Client(host, client);
    cx.onConnectionLost = onConnectionLost;
    cx.onMessageArrived = onMessageArrived;
    const props = {
      onSuccess: onConnect,
      onFailure: onFailure,
      useSSL: true,
    };

    if (username) {
      props.userName = username;
      props.password = password;
    }
    cx.connect(props);
  }
  return this.withHap((hap) => {
    const onTrigger = (t_deprecate, hap, currentTime, cps, targetTime) => {
      if (!connected) {
        return;
      }
      let message = '';
      if (typeof hap.value === 'object') {
        message = JSON.stringify(hap.value);
      } else {
        message = hap.value;
      }
      message = new Paho.Message(message);
      message.destinationName = topic;

      const offset = (targetTime - currentTime + latency) * 1000;

      window.setTimeout(function () {
        cx.send(message);
      }, offset);
    };
    return hap.setContext({ ...hap.context, onTrigger, dominantTrigger: true });
  });
};
