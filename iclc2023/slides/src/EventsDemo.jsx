import EventEditor from './EventEditor.jsx';
import { useState } from 'react';

const snippets = [
  [`{ "s": "cp" }`, 'Samples'],
  [`{ "s": "sawtooth", "note": "e3" }`, 'Oscillators'],
  [
    `[
  { "s": "gm_epiano2", "note": "c4" },
  { "s": "gm_epiano2", "note": "eb4" },
  { "s": "gm_epiano2", "note": "g4" }
]`,
    'Soundfonts',
  ],
  [
    `{ 
  "s": "toys",
  "cutoff": 2000,
  "delay": 0.5,
  "crush": 4
}`,
    'Effects',
  ],
];

function EventsDemo() {
  const [step, setStep] = useState(1);

  return (
    <div className="not-prose">
      {snippets.slice(0, step).map(([code, label], i) => {
        const isActive = i === step - 1;
        return (
          <div key={i} className={`border-l-4 pl-8 border-gray-500 py-4 ${isActive ? 'p-4 border-yellow-500' : ''}`}>
            <h3 className="pb-4">{label}</h3>
            <EventEditor code={code} />
          </div>
        );
      })}
      {step < snippets.length && <button onClick={() => setStep((r) => r + 1)}>next</button>}
    </div>
  );
}

export default EventsDemo;
