import React from 'react';
import ReactDOM from 'react-dom';
import Deck from './deck.mdx';
import './style.css';
import '@strudel.cycles/react/dist/style.css';

import 'prismjs/themes/prism-tomorrow.css';

ReactDOM.render(
  <React.StrictMode>
    <div className="w-screen h-screen overflow-auto bg-slate-900">
      <Deck />
    </div>
  </React.StrictMode>,
  document.getElementById('root'),
);
