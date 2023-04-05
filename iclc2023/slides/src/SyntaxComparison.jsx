import { useState } from 'react';
import { SlideRepl } from './SlideRepl.jsx';
import Highlight from './Highlight.jsx';

const snippets = [
  [`sound "bd ~ [sd cp]"`, [`sound("bd ~ [sd cp]")`], 'Mini Notation'], //
  [`sound "bd ~ [sd cp]" # speed "1 2"`, [`sound("bd ~ [sd cp]").speed("1 2")`], 'Composing Patterns'],
  [
    `fast 2 $ sound "bd ~ [sd cp]"`,
    [`fast(2, sound("bd ~ [sd cp]"))`, `sound("bd ~ [sd cp]").fast(2)`],
    'Patterns Transformations',
  ],
  [
    `speed "1 2 3" + "4 5" # s "bd"`,
    ['speed("1 2 3".add("4 5")).s("bd")', '"1 2 3".add("4 5").speed().s("bd")'],
    'Pattern Arithmetic',
  ],
  [
    `jux rev 
  $ every 3 (fast 2) 
  $ sound "bd sd"`,
    [
      `sound("bd sd")
  .every(3, fast(2))
  .jux(rev)`,
    ],
  ],
  [
    `jux rev 
  $ every "<3 5>" (fast "1 2") 
  $ sound "bd sd cp mt"`,
    [
      `sound("bd sd cp mt")
  .every("<3 5>", fast("1 2"))
  .jux(rev)`,
    ],
  ],
];

function SyntaxComparison() {
  const [step, setStep] = useState(1);
  return (
    <>
      <div className=" not-prose justify-start items-start">
        {/* <div className="grid grid-cols-2">
          <div>Tidal</div>
          <div>Strudel</div>
        </div> */}
        {snippets.slice(0, step).map(([hs, js, label], i) => (
          <div key={i} className={`border-t border-gray-500 py-4`}>
            <h3 className="pb-4">{label}</h3>
            <div>
              <div className="flex space-x-2">
                <img src="./img/haskell.png" className="h-10 mt-1" />
                <Highlight language="haskell" code={hs} />
              </div>
              <div>
                {js.map((c) => (
                  <div className="flex space-x-2">
                    <img src="./img/js.jpg" className="h-10 mt-1" />
                    <SlideRepl tune={c} hideHeader />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {step < snippets.length && <button onClick={() => setStep((r) => r + 1)}>next</button>}
    </>
  );
}

export default SyntaxComparison;
