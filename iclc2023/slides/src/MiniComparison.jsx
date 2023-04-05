import { useState } from 'react';
import { SlideRepl } from './SlideRepl.jsx';

const snippets = [
  [`sound("bd [hh sd]")`, `sound(seq("bd", ["hh", "sd"]))`, 'Nested Sequences'], //
  [`sound("<bd sd>")`, `sound(cat("bd", "sd"))`, 'Cyclewise Sequences'], //
  [`sound("bd,hh")`, `sound(stack("bd", "hh"))`, 'Stack'], //
  [`sound("bd@3 sd@1")`, `sound(timeCat([3, "bd"], [1, "sd"]))`, 'Weighted Sequence'], //
  [`sound("{lt ht mt, bd sd}")`, `sound(polymeter(["lt","ht","mt"], ["bd", "sd"]))`, 'Polymeter'], //
  [`sound("{bd hh sd ht}%2")`, `sound(polymeterSteps(2, ["bd", "hh", "sd", "ht"]))`, 'Steps per Cycle'],
];

function MiniComparison() {
  const [step, setStep] = useState(1);
  return (
    <>
      <h1>Mini Notation vs Regular JS</h1>
      <div className="not-prose">
        {snippets.slice(0, step).map(([a, b, label], i) => {
          const isActive = i === step - 1;
          return (
            <div key={i} className={`border-l-4 pl-8 border-gray-500 py-4 ${isActive ? 'p-4 border-yellow-500' : ''}`}>
              <h3 className="pb-4">{label}</h3>
              <div className="flex space-x-2">
                <img src="./img/tidalcycles.svg" className={`h-10 mt-2`} />
                <SlideRepl tune={a} hideHeader />
              </div>
              <div className="flex space-x-2">
                <img src="./img/js.jpg" className={`h-10 mt-2`} />
                <SlideRepl tune={b} hideHeader />
              </div>
            </div>
          );
        })}
      </div>
      {step < snippets.length && <button onClick={() => setStep((r) => r + 1)}>next</button>}
    </>
  );
}

export default MiniComparison;
