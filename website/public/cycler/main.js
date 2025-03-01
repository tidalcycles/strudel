import './style.css'
import { NeoCyclist } from '../../strudel/packages/core/neocyclist.mjs';
import { saw } from '@strudel/core';
// import { getTrigger } from '@strudel/core/repl.mjs';
import { setInterval, clearInterval } from 'worker-timers';
import { getAudioContext } from '@strudel/webaudio';


document.querySelector('#app').innerHTML = `
  <div>
    <h1>Cycler</h1>
    <div id="record">
    💿
    </div>
  </div>
`

const record = document.getElementById('record');

const schedulerOptions = {
  onTrigger: x => { },
  getTime: () => getAudioContext().currentTime,
  onToggle: (started) => console.log("started: ", started),
  setInterval,
  clearInterval,
  // beforeStart,
};
const cyclist = new NeoCyclist(schedulerOptions);

record.onclick = () => {

  if (!cyclist.started) {
    cyclist.start();
  }
  console.log('aha', cyclist.getTime(), cyclist.cycle)
  cyclist.setPattern(saw.segment(16));

}

const timer = setInterval(function () {
  if (cyclist && cyclist.started) {
    // console.log(cyclist.cycle);
    const deg = (cyclist.cycle % 1) * 360;
    record.style.webkitTransform = 'rotate(' + deg + 'deg)';
    record.style.mozTransform = 'rotate(' + deg + 'deg)';
    record.style.msTransform = 'rotate(' + deg + 'deg)';
    record.style.oTransform = 'rotate(' + deg + 'deg)';
    record.style.transform = 'rotate(' + deg + 'deg)';
  }
}, 50);
