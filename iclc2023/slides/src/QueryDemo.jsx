import { SlideRepl } from './SlideRepl.jsx';
import Highlight from './Highlight.jsx';
import { useState } from 'react';

const snippets = [
  [<SlideRepl tune={`sound("bd [hh sd]").crush(4).log()`} hideHeader />, 'Logging Events'],
  [
    <>
      <Highlight
        code={`sound("bd [hh sd]").crush(4) // pattern
.queryArc(0, 1)`}
        language="javascript"
      />
      <Highlight
        language="json"
        code={`[
  "0/1 -> 1/2 | sound:bd", 
  "1/2 -> 3/4 | sound:hh", 
  "3/4 -> 1/1 | sound:sd"
]`}
      />
    </>,
    'Querying Events Manually',
  ],
];

function QueryDemo() {
  const [step, setStep] = useState(1);
  return (
    <div className="not-prose">
      {snippets.slice(0, step).map(([snippet, label], i) => {
        const isActive = i === step - 1;
        return (
          <div key={i} className={`border-l-4 pl-8 border-gray-500 py-4 ${isActive ? 'p-4 border-yellow-500' : ''}`}>
            <h3 className="pb-4">{label}</h3>
            {snippet}
          </div>
        );
      })}
      {step < snippets.length && <button onClick={() => setStep((r) => r + 1)}>next</button>}
    </div>
  );
}

export default QueryDemo;
