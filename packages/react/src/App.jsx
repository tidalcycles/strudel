import React from 'react';
import { MiniRepl } from './components/MiniRepl';
import 'tailwindcss/tailwind.css';

function App() {
  return (
    <div>
      <MiniRepl tune={`"c3"`} />
    </div>
  );
}

export default App;
