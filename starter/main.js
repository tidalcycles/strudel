import { evaluate, evalScope } from '@strudel.cycles/eval';
import { Scheduler, getAudioContext } from '@strudel.cycles/webaudio';

const ac = getAudioContext();

const scheduler = new Scheduler({
  audioContext: ac,
  interval: 0.1,
  onEvent: (e) => {
    // console.log('e', e.show());
    const oscillator = ac.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(e.value, ac.currentTime); // value in hertz
    oscillator.connect(ac.destination);
    oscillator.start(e.whole.begin);
    oscillator.stop(e.whole.end);
  },
});

await evalScope(
  import('@strudel.cycles/core'),
  import('@strudel.cycles/mini'),
  // import other strudel packages here
); // add strudel to eval scope

document.getElementById('start').addEventListener('click', async () => {
  const { pattern } = await evaluate(`"55 [110,165] 110 [220,275]".mul("<1 <3/4 2/3>>").struct("x(3,8)")`);
  scheduler.setPattern(pattern);
  scheduler.start();
});
