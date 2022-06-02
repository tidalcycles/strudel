import React from 'react';
import ReactDOM from 'react-dom';
import Deck from './deck.mdx';
import './style.css';
import '@strudel.cycles/react/dist/style.css';

ReactDOM.render(
  <React.StrictMode>
    <Deck />
  </React.StrictMode>,
  document.getElementById('root'),
);
