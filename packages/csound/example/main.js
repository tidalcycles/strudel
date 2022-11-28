import { Csound } from '@csound/browser';
import './style.css';
import csd from './tutorial1.csd?raw';

document.querySelector('#app').innerHTML = `
  <div>
    <button id="startButton">Start</button>
  </div>
`;

let csound = null;
const startCsound = async () => {
  if (csound) {
    return;
  }
  console.log('Starting Csound...');
  csound = await Csound();
  console.log(csound);
  window.csound = csound;

  await csound.compileCsdText(csd);
  await csound.start();

  document.querySelector('#startButton').remove();
};

document.querySelector('#startButton').addEventListener('click', startCsound);
