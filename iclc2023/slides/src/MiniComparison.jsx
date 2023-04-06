import { SlideRepl } from './SlideRepl.jsx';
import Stepper from './Stepper.jsx';

const snippets = [
  [`sound("bd [hh sd]")`, `sound(seq("bd", ["hh", "sd"]))`, 'Nested Sequences'], //
  [`sound("<bd sd>")`, `sound(cat("bd", "sd"))`, 'Cyclewise Sequences'], //
  [`sound("bd,hh")`, `sound(stack("bd", "hh"))`, 'Stack'], //
  [`sound("bd@3 sd@1")`, `sound(timeCat([3, "bd"], [1, "sd"]))`, 'Weighted Sequence'], //
  [`sound("{lt ht mt, bd sd}")`, `sound(polymeter(["lt","ht","mt"], ["bd", "sd"]))`, 'Polymeter'], //
  [`sound("{bd hh sd ht}%2")`, `sound(polymeterSteps(2, ["bd", "hh", "sd", "ht"]))`, 'Steps per Cycle'],
];

function MiniComparison() {
  return (
    <>
      <h1>
        Mini Notation -&gt; JavaScript
        <br />
        <small>External DSL</small>
      </h1>
      <Stepper
        steps={snippets.map(([a, b, label]) => (
          <>
            <h3 className="pb-4">{label}</h3>
            <div className="flex space-x-2">
              <img src="./img/tidalcycles.svg" className={`h-10 mt-2`} />
              <SlideRepl tune={a} hideHeader />
            </div>
            <div className="flex space-x-2">
              <img src="./img/js.jpg" className={`h-10 mt-2`} />
              <SlideRepl tune={b} hideHeader />
            </div>
          </>
        ))}
      />
    </>
  );
}

export default MiniComparison;
