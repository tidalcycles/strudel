import React from 'react';
import ReactDOM from 'react-dom';
import Tutorial from './tutorial.mdx';
// import logo from '../logo.svg';

ReactDOM.render(
  <React.StrictMode>
    <div className="min-h-screen">
      <header className="flex-none flex justify-center w-full h-16 px-2 items-center border-b border-gray-200 bg-white">
        <div className="p-4 w-full max-w-3xl flex justify-between">
          <div className="flex items-center space-x-2">
            <img src={'https://tidalcycles.org/img/logo.svg'} className="Tidal-logo w-16 h-16" alt="logo" />
            <h1 className="text-2xl">Strudel Tutorial</h1>
          </div>
          {!window.location.href.includes('localhost') && (
            <div className="flex space-x-4">
              <a href="../">go to REPL</a>
            </div>
          )}
        </div>
      </header>
      <div className="flex justify-center">
        <main className="p-4 max-w-3xl prose">
          <Tutorial />
        </main>
      </div>
    </div>
  </React.StrictMode>,
  document.getElementById('root')
);
