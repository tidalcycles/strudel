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
