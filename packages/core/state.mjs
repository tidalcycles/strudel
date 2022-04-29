/*
state.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/state.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

export class State {
  constructor(span, controls = {}) {
    this.span = span;
    this.controls = controls;
  }

  // Returns new State with different span
  setSpan(span) {
    return new State(span, this.controls);
  }

  withSpan(func) {
    return this.setSpan(func(this.span));
  }

  // Returns new State with different controls
  setControls(controls) {
    return new State(this.span, controls);
  }
}

export default State;
