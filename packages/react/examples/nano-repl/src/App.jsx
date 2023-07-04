import { controls, evalScope } from '@strudel.cycles/core';
import { CodeMirror, useHighlighting, useKeydown, useStrudel, flash } from '@strudel.cycles/react';
import {
  getAudioContext,
  initAudioOnFirstClick,
  panic,
  webaudioOutput,
  registerSynthSounds,
} from '@strudel.cycles/webaudio';
import { registerSoundfonts } from '@strudel.cycles/soundfonts';
import { useCallback, useState } from 'react';
import './style.css';
// import { prebake } from '../../../../../repl/src/prebake.mjs';

initAudioOnFirstClick();

async function init() {
  // TODO: only import stuff when play is pressed?
  const loadModules = evalScope(
    controls,
    import('@strudel.cycles/core'),
    import('@strudel.cycles/tonal'),
    import('@strudel.cycles/mini'),
    import('@strudel.cycles/xen'),
    import('@strudel.cycles/webaudio'),
    import('@strudel.cycles/osc'),
  );

  await Promise.all([loadModules, registerSynthSounds(), registerSoundfonts()]);
}
init();

const defaultTune = `samples({
  bd: ['bd/BT0AADA.wav','bd/BT0AAD0.wav','bd/BT0A0DA.wav','bd/BT0A0D3.wav','bd/BT0A0D0.wav','bd/BT0A0A7.wav'],
  sd: ['sd/rytm-01-classic.wav','sd/rytm-00-hard.wav'],
  hh: ['hh27/000_hh27closedhh.wav','hh/000_hh3closedhh.wav'],
}, 'github:tidalcycles/Dirt-Samples/master/');
stack(
  s("bd,[~ <sd!3 sd(3,4,2)>],hh*8") // drums
  .speed(perlin.range(.7,.9)) // random sample speed variation
  //.hush()
  ,"<a1 b1*2 a1(3,8) e2>" // bassline
  .off(1/8,x=>x.add(12).degradeBy(.5)) // random octave jumps
  .add(perlin.range(0,.5)) // random pitch variation
  .superimpose(add(.05)) // add second, slightly detuned voice
  .note() // wrap in "note"
  .decay(.15).sustain(0) // make each note of equal length
  .s('sawtooth') // waveform
  .gain(.4) // turn down
  .cutoff(sine.slow(7).range(300,5000)) // automate cutoff
  //.hush()
  ,"<Am7!3 <Em7 E7b13 Em7 Ebm7b5>>".voicings('lefthand') // chords
  .superimpose(x=>x.add(.04)) // add second, slightly detuned voice
  .add(perlin.range(0,.5)) // random pitch variation
  .note() // wrap in "n"
  .s('square') // waveform
  .gain(.16) // turn down
  .cutoff(500) // fixed cutoff
  .attack(1) // slowly fade in
  //.hush()
  ,"a4 c5 <e6 a6>".struct("x(5,8)")
  .superimpose(x=>x.add(.04)) // add second, slightly detuned voice
  .add(perlin.range(0,.5)) // random pitch variation
  .note() // wrap in "note"
  .decay(.1).sustain(0) // make notes short
  .s('triangle') // waveform
  .degradeBy(perlin.range(0,.5)) // randomly controlled random removal :)
  .echoWith(4,.125,(x,n)=>x.gain(.15*1/(n+1))) // echo notes
  //.hush()
)
.fast(2/3)`;

// await prebake();

const ctx = getAudioContext();
const getTime = () => ctx.currentTime;
function App() {
  const [code, setCode] = useState(defaultTune);
  const [view, setView] = useState();
  // const [code, setCode] = useState(`"c3".note().slow(2)`);
  const { scheduler, evaluate, schedulerError, evalError, isDirty, activeCode, pattern, started } = useStrudel({
    code,
    defaultOutput: webaudioOutput,
    getTime,
    afterEval: ({ meta }) => setMiniLocations(meta.miniLocations),
  });

  const { setMiniLocations } = useHighlighting({
    view,
    pattern,
    active: started && !activeCode?.includes('strudel disable-highlighting'),
    getTime: () => scheduler.now(),
  });

  const error = evalError || schedulerError;
  useKeydown(
    useCallback(
      async (e) => {
        if (e.ctrlKey || e.altKey) {
          if (e.code === 'Enter') {
            e.preventDefault();
            flash(view);
            await evaluate(code);
            if (e.shiftKey) {
              panic();
              scheduler.stop();
              scheduler.start();
            }
            if (!scheduler.started) {
              scheduler.start();
            }
          } else if (e.code === 'Period') {
            scheduler.stop();
            panic();
            e.preventDefault();
          }
        }
      },
      [scheduler, evaluate, view, code],
    ),
  );
  return (
    <div>
      <nav className="z-[12] w-full flex justify-center fixed bottom-0">
        <div className="bg-slate-500 space-x-2 px-2 rounded-t-md">
          <button
            onClick={async () => {
              await evaluate(code);
              scheduler.start();
            }}
          >
            start
          </button>
          <button onClick={() => scheduler.stop()}>stop</button>
          {isDirty && <button onClick={() => evaluate(code)}>eval</button>}
        </div>
        {error && <p>error {error.message}</p>}
      </nav>
      <CodeMirror value={code} onChange={setCode} onViewChanged={setView} />
    </div>
  );
}

export default App;
