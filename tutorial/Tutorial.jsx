/*
Tutorial.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/tutorial/Tutorial.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';
import ReactDOM from 'react-dom';
import Tutorial from './tutorial.mdx';
import './style.css';
import '@strudel.cycles/react/dist/style.css';

ReactDOM.render(
  <React.StrictMode>
    <div className="min-h-screen">
      <header className="flex-none flex justify-center w-full h-16 px-2 items-center border-b border-gray-200 bg-white">
        <div className="p-4 w-full max-w-3xl flex justify-between">
          <div className="flex items-center space-x-2">
            <img src={'https://tidalcycles.org/img/logo.svg'} className="Tidal-logo w-10 h-10" alt="logo" />
            <h1 className="text-xl">Strudel Tutorial</h1>
          </div>
          {!window.location.href.includes('localhost') && (
            <div className="flex space-x-4">
              <a href="../">go to REPL</a>
            </div>
          )}
        </div>
      </header>
      <main className="p-4 max-w-3xl prose">
        <Tutorial />
      </main>
    </div>
  </React.StrictMode>,
  document.getElementById('root'),
);
