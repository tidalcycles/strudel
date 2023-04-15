import { SlideRepl } from './SlideRepl.jsx';
import Highlight from './Highlight.jsx';
import Stepper from './Stepper.jsx';

const snippets = [
  [
    <>
      {' '}
      <SlideRepl tune={`s("bd [hh sd]").crush(4).log()`} hideHeader />
    </>,
    'Logging Events',
  ],
  [
    <>
      <Highlight
        code={`let pattern = s("bd [hh sd]").crush(4);
let events = pattern.queryArc(0, 1);
console.log(events.map(e => e.show()))`}
        language="javascript"
      />
      <Highlight
        language="json"
        code={`[
  "0/1 -> 1/2 | s:bd crush:4", 
  "1/2 -> 3/4 | s:hh crush:4", 
  "3/4 -> 1/1 | s:sd crush:4"
]`}
      />
    </>,
    'Querying Events Manually',
  ],
];

function QueryDemo() {
  return (
    <>
      <img src="./img/queryflow.png" className="w-[800px]" />
      <Stepper
        steps={snippets.map(([snippet, label]) => (
          <div className="py-4 space-y-4">
            <h3>{label}</h3>
            {snippet}
          </div>
        ))}
      />
    </>
  );
}

export default QueryDemo;
