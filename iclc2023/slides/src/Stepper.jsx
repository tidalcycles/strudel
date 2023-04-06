import { useState } from 'react';

function Stepper({ steps }) {
  const [step, setStep] = useState(1);
  return (
    <div className="not-prose">
      {steps.slice(0, step).map((snippet, i) => {
        const isActive = i === step - 1;
        return (
          <div key={i} className={`border-l-4 pl-8 border-gray-500 py-4 ${isActive ? 'p-4 border-yellow-500' : ''}`}>
            {snippet}
          </div>
        );
      })}
      {step < steps.length && <button onClick={() => setStep((r) => r + 1)}>next</button>}
    </div>
  );
}

export default Stepper;
