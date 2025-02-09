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
  if (typeof window !== 'undefined') {
    document.cookie = 'mqtt_pass=';
  }
}

Pattern.prototype.mqtt = function (
  username = undefined,
  password = undefined,
  topic = undefined,
  host = 'wss://localhost:8883/',
  client = undefined,
  latency = 0,
  add_meta = true,
) {
  const key = host + '-' + client;
  let password_entered = false;

  function onConnect() {
    console.log('Connected to mqtt broker');
    if (password_entered) {
      document.cookie = 'mqtt_pass=' + password;
    }
  }

  let cx;
  if (connections[key]) {
    cx = connections[key];
  } else {
    if (!client) {
      client = 'strudel-' + String(Math.floor(Math.random() * 1000000));
    }
    cx = new Paho.Client(host, client);
    connections[key] = cx;
    cx.onConnectionLost = onConnectionLost;
    cx.onMessageArrived = onMessageArrived;
    const props = {
      onSuccess: onConnect,
      onFailure: onFailure,
      useSSL: true,
    };

    if (username) {
      props.userName = username;
      if (typeof password === 'undefined' && typeof window !== 'undefined') {
        const cookie = /mqtt_pass=(\w+)/.exec(window.document.cookie);
        if (cookie) {
          password = cookie[1];
        }
        if (typeof password === 'undefined') {
          password = prompt('Please enter MQTT server password');
          password_entered = true;
        }
      }

      props.password = password;
    }
    cx.connect(props);
  }
  return this.withHap((hap) => {
    const onTrigger = (t_deprecate, hap, currentTime, cps, targetTime) => {
      let msg_topic = topic;
      if (!cx || !cx.isConnected()) {
        return;
      }
      let message = '';
      if (typeof hap.value === 'object') {
        let value = hap.value;

        // Try to take topic from pattern if it's not set
        if (typeof msg_topic === 'undefined' && 'topic' in value) {
          msg_topic = value.topic;
          if (Array.isArray(msg_topic)) {
            msg_topic = msg_topic.join('/');
          }
          msg_topic = '/' + msg_topic;
        }
        if (add_meta) {
          const duration = hap.duration.div(cps);
          value = { ...value, duration: duration.valueOf(), cps: cps };
        }
        message = JSON.stringify(value);
      } else {
        message = hap.value;
      }
      message = new Paho.Message(message);
      message.destinationName = msg_topic;

      const offset = (targetTime - currentTime + latency) * 1000;

      window.setTimeout(function () {
        cx.send(message);
      }, offset);
    };
    return hap.setContext({ ...hap.context, onTrigger, dominantTrigger: true });
  });
};
