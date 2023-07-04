/*
ui.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/ui.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { getTime } from './time.mjs';

function frame(callback) {
  if (window.strudelAnimation) {
    cancelAnimationFrame(window.strudelAnimation);
  }
  const animate = (animationTime) => {
    callback(animationTime, getTime());
    window.strudelAnimation = requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

export const backgroundImage = function (src, animateOptions = {}) {
  const container = document.getElementById('code');
  const bg = 'background-image:url(' + src + ');background-size:contain;';
  container.style = bg;
  const { className: initialClassName } = container;
  const handleOption = (option, value) => {
    ({
      style: () => (container.style = bg + ';' + value),
      className: () => (container.className = value + ' ' + initialClassName),
    })[option]();
  };
  const funcOptions = Object.entries(animateOptions).filter(([_, v]) => typeof v === 'function');
  const stringOptions = Object.entries(animateOptions).filter(([_, v]) => typeof v === 'string');
  stringOptions.forEach(([option, value]) => handleOption(option, value));

  if (funcOptions.length === 0) {
    return;
  }
  frame((_, t) =>
    funcOptions.forEach(([option, value]) => {
      handleOption(option, value(t));
    }),
  );
};

export const cleanupUi = () => {
  const container = document.getElementById('code');
  if (container) {
    container.style = '';
    // TODO: find a way to remove that duplication..
    container.className = 'grow flex text-gray-100 relative overflow-auto cursor-text pb-0'; // has to match App.tsx
  }
};
