/*
tailwind.config.js - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/tailwind.config.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

module.exports = {
  // TODO: find out if leaving out tutorial path works now
  content: ['./src/**/*.{js,jsx,ts,tsx}', './tutorial/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#c792ea',
        secondary: '#c3e88d',
        tertiary: '#82aaff',
        highlight: '#ffcc00',
        linegray: '#8a91991a',
        lineblack: '#00000095',
        bg: '#222222',
        // header: '#8a91991a',
        // footer: '#8a91991a',
        header: '#00000050',
        // header: 'transparent',
        footer: '#00000050',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
