import controls from '@strudel.cycles/core/controls.mjs';
import { evalScope } from '@strudel.cycles/eval';
import { getAudioContext, panic, webaudioOutput } from '@strudel.cycles/webaudio';
import { useCallback, useState } from 'react';
import useScheduler from '../../../src/hooks/useScheduler';
import useEvaluator from '../../../src/hooks/useEvaluator';
import useKeydown from '../../../src/hooks/useKeydown.mjs';
import CodeMirror, { flash } from '../../../src/components/CodeMirror6';
import './style.css';
// import { prebake } from '../../../../../repl/src/prebake.mjs';

// TODO: only import stuff when play is pressed?
await evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tone'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/osc'),
  import('@strudel.cycles/webdirt'),
  import('@strudel.cycles/serial'),
  import('@strudel.cycles/soundfonts'),
);

const defaultTune = `samples({
  bd: ['bd/BT0AADA.wav','bd/BT0AAD0.wav','bd/BT0A0DA.wav','bd/BT0A0D3.wav','bd/BT0A0D0.wav','bd/BT0A0A7.wav'],
  sd: ['sd/rytm-01-classic.wav','sd/rytm-00-hard.wav'],
  hh: ['hh27/000_hh27closedhh.wav','hh/000_hh3closedhh.wav'],
}, 'github:tidalcycles/Dirt-Samples/master/');
stack(
  s("bd,[~ <sd!3 sd(3,4,2)>],hh(3,4)") // drums
  .speed(perlin.range(.7,.9)) // random sample speed variation
  //.hush()
  ,"<a1 b1*2 a1(3,8) e2>" // bassline
  .off(1/8,x=>x.add(12).degradeBy(.5)) // random octave jumps
  .add(perlin.range(0,.5)) // random pitch variation
  .superimpose(add(.05)) // add second, slightly detuned voice
  .n() // wrap in "n"
  .decay(.15).sustain(0) // make each note of equal length
  .s('sawtooth') // waveform
  .gain(.4) // turn down
  .cutoff(sine.slow(7).range(300,5000)) // automate cutoff
  //.hush()
  ,"<Am7!3 <Em7 E7b13 Em7 Ebm7b5>>".voicings() // chords
  .superimpose(x=>x.add(.04)) // add second, slightly detuned voice
  .add(perlin.range(0,.5)) // random pitch variation
  .n() // wrap in "n"
  .s('sawtooth') // waveform
  .gain(.16) // turn down
  .cutoff(500) // fixed cutoff
  .attack(1) // slowly fade in
  //.hush()
  ,"a4 c5 <e6 a6>".struct("x(5,8)")
  .superimpose(x=>x.add(.04)) // add second, slightly detuned voice
  .add(perlin.range(0,.5)) // random pitch variation
  .n() // wrap in "n"
  .decay(.1).sustain(0) // make notes short
  .s('triangle') // waveform
  .degradeBy(perlin.range(0,.5)) // randomly controlled random removal :)
  .echoWith(4,.125,(x,n)=>x.gain(.15*1/(n+1))) // echo notes
  //.hush()
)
.cps(2/3)`;

// await prebake();

function App() {
  const [code, setCode] = useState(defaultTune);
  const { evaluate, pattern, isDirty, error: evaluatorError } = useEvaluator({ code });
  const { scheduler, error: schedulerError } = useScheduler(pattern, webaudioOutput);
  const [view, setView] = useState();
  const error = evaluatorError || schedulerError;
  useKeydown(
    useCallback(
      (e) => {
        if (e.ctrlKey || e.altKey) {
          if (e.code === 'Enter') {
            e.preventDefault();
            flash(view);
            evaluate();
            if (e.shiftKey) {
              panic();
              scheduler.stop();
              scheduler.start();
            }
            if (!scheduler.started) {
              scheduler.start();
            }
          } else if (e.code === 'Period') {
            scheduler.pause();
            panic();
            e.preventDefault();
          }
        }
      },
      [scheduler, evaluate, view],
    ),
  );
  return (
    <div>
      {/* <textarea value={code} onChange={(e) => setCode(e.target.value)} cols="64" rows="30" /> */}
      <nav className="z-[12] w-full flex justify-center absolute bottom-0">
        <div className="bg-slate-500 space-x-2 px-2 rounded-t-md">
          <button
            onClick={() => {
              getAudioContext().resume();
              scheduler.start();
            }}
          >
            start
          </button>
          <button onClick={() => scheduler.stop()}>stop</button>
          {isDirty && <button onClick={() => evaluate()}>eval</button>}
        </div>
        {error && <p>error {error.message}</p>}
      </nav>
      <CodeMirror value={code} onChange={setCode} onViewChanged={setView} />
    </div>
  );
}

export default App;
