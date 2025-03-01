/*
Vinyl.jsx - <short description TODO>
Copyright (C) 2025 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import React, { useState, useEffect } from "react";
import { setInterval, clearInterval } from 'worker-timers';
import { NeoCyclist } from '@strudel/core/neocyclist.mjs';
import { getAudioContext } from '@strudel/webaudio';
import { saw } from '@strudel/core';
import encoder from '../../public/encoder_disc.svg';

console.log(encoder);

const schedulerOptions = {
  onTrigger: (x) => { },
  getTime: () => getAudioContext().currentTime,
  onToggle: (started) => console.log('started: ', started),
  setInterval,
  clearInterval,
  // beforeStart,
};
const cyclist = new NeoCyclist(schedulerOptions);

export function Vinyl() {
  const [isActive, setIsActive] = useState(false);
  const [cyclepos, setCyclepos] = useState(0);
  const activate = () => setIsActive(true);

  if (isActive) {
    if (!cyclist.started) {
      cyclist.start();
      cyclist.setPattern(saw.segment(16));
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCyclepos(cyclist.cycle);
    }, 10);
    return () => clearInterval(intervalId);
  }, []);

  const deg = (cyclepos % 1) * 360;

  const style = {
    fontSize: "20em",
    transform: 'rotate(' + deg + 'deg)'
  };
  return <div onClick={activate} style={style}><center><img src={encoder.src} /></center></div>
}