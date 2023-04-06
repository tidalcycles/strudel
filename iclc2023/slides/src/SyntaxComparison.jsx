import { SlideRepl } from './SlideRepl.jsx';
import Highlight from './Highlight.jsx';
import Stepper from './Stepper.jsx';

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
  .every(3, fast("2"))
  .jux(rev)`,
    ],
    'Higher order transformations (with partial application)',
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
    'Patterns all the way down',
  ],
];

function SyntaxComparison() {
  return (
    <>
      <h1>
        Haskell -&gt; JavaScript
        <br />
        <small>Internal DSL / Fluent Interface</small>
      </h1>
      <Stepper
        steps={snippets.map(([hs, js, label]) => (
          <>
            <h3 className="pb-4">{label}</h3>
            <div>
              <div className="flex space-x-4">
                <img src="./img/haskell.png" className="h-10 mt-2" />
                <Highlight language="haskell" code={hs} />
              </div>
              <div>
                {js.map((c, j) => (
                  <div className="flex space-x-4" key={j}>
                    <img src="./img/js.jpg" className={`h-10 mt-2`} />
                    <SlideRepl tune={c} hideHeader />
                  </div>
                ))}
              </div>
            </div>
          </>
        ))}
      />
    </>
  );
}

export default SyntaxComparison;
