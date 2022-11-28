import { Csound } from '@csound/browser';
import './style.css';
// import csd from './tutorial1.csd?raw';
import csd from './tutorial2.csd?raw';

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
  await csound.setOption('-m0');
  await csound.compileCsdText(csd);
  await csound.setControlChannel('main.note.amp', -12);
  await csound.start();

  document.querySelector('#startButton').remove();
  createPerformanceUI(csound);
};
const createPerformanceUI = (csound) => {
  document.querySelector('#app').innerHTML = `
    <div>
      <button id='flourish'>Flourish</button>
      <input id='ampSlider' type='range' min='-60' max='-12' value='-12'/>
    </div>
  `;

  document.querySelector('#flourish').addEventListener('click', async () => {
    console.log('flourish..');
    // await csound.readScore(`i "Flourish" 0 0 0`);
    await csound.evalCode(`
    schedule("Flourish", next_time(.25), 0, 0)
  `);
  });
  document.querySelector('#ampSlider').addEventListener('input', async (evt) => {
    await csound.setControlChannel('main.note.amp', evt.target.value);
  });
};

document.querySelector('#startButton').addEventListener('click', startCsound);
