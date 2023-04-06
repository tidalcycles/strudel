import EventEditor from './EventEditor.jsx';
import Stepper from './Stepper.jsx';

const snippets = [
  [`{ "s": "cp", "crush": 4 }`, 'Samples'],
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
  return (
    <Stepper
      steps={snippets.map(([code, label]) => (
        <>
          <h3 className="pb-4">{label}</h3>
          <EventEditor code={code} />
        </>
      ))}
    />
  );
}

export default EventsDemo;
