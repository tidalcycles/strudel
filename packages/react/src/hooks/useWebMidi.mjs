/*
useWebMidi.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/useWebMidi.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { useEffect, useState } from 'react';
import { enableWebMidi, WebMidi } from '@strudel.cycles/midi'

export function useWebMidi(props) {
  const { ready, connected, disconnected } = props;
  const [loading, setLoading] = useState(true);
  const [outputs, setOutputs] = useState(WebMidi?.outputs || []);
  useEffect(() => {
    enableWebMidi()
      .then(() => {
        // Reacting when a new device becomes available
        WebMidi.addListener('connected', (e) => {
          setOutputs([...WebMidi.outputs]);
          connected?.(WebMidi, e);
        });
        // Reacting when a device becomes unavailable
        WebMidi.addListener('disconnected', (e) => {
          setOutputs([...WebMidi.outputs]);
          disconnected?.(WebMidi, e);
        });
        ready?.(WebMidi);
        setLoading(false);
      })
      .catch((err) => {
        if (err) {
          console.error(err);
          //throw new Error("Web Midi could not be enabled...");
          console.warn('Web Midi could not be enabled..');
          return;
        }
      });
  }, [ready, connected, disconnected, outputs]);
  const outputByName = (name) => WebMidi.getOutputByName(name);
  return { loading, outputs, outputByName };
}
