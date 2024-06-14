/*
server.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/osc/server.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import OSC from 'osc-js';

const config = {
  receiver: 'ws', // @param {string} Where messages sent via 'send' method will be delivered to, 'ws' for Websocket clients, 'udp' for udp client
  udpServer: {
    host: 'localhost', // @param {string} Hostname of udp server to bind to
    port: 57121, // @param {number} Port of udp client for messaging
    // enabling the following line will receive tidal messages:
    // port: 57120, // @param {number} Port of udp client for messaging
    exclusive: false, // @param {boolean} Exclusive flag
  },
  udpClient: {
    host: 'localhost', // @param {string} Hostname of udp client for messaging
    port: 57120, // @param {number} Port of udp client for messaging
  },
  wsServer: {
    host: 'localhost', // @param {string} Hostname of WebSocket server
    port: 8080, // @param {number} Port of WebSocket server
  },
};

const osc = new OSC({ plugin: new OSC.BridgePlugin(config) });

osc.open(); // start a WebSocket server on port 8080

console.log('osc client running on port', config.udpClient.port);
console.log('osc server running on port', config.udpServer.port);
console.log('websocket server running on port', config.wsServer.port);
