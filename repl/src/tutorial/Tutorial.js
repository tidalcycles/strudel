import React from 'react';
import ReactDOM from 'react-dom';
import Tutorial from './tutorial.mdx';
import logo from '../logo.svg';

ReactDOM.render(
  <React.StrictMode>
    <div className="min-h-screen flex flex-col">
      <header className="flex-none w-full h-16 px-2 flex items-center border-b border-gray-200 bg-white justify-between">
        <div className="flex items-center space-x-2">
          <img src={logo} className="Tidal-logo w-16 h-16" alt="logo" />
          <h1 className="text-2xl">Strudel Tutorial</h1>
        </div>
        {!window.location.href.includes('localhost') && (
          <div className="flex space-x-4">
            <a href="../">go to REPL</a>
          </div>
        )}
      </header>
      <section className="prose p-4">
        <Tutorial />
      </section>
    </div>
  </React.StrictMode>,
  document.getElementById('root')
);
