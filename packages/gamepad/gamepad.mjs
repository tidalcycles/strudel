// @strudel/gamepad/index.mjs

import { signal } from '@strudel/core';

// Button mapping for Logitech Dual Action (STANDARD GAMEPAD Vendor: 046d Product: c216)
export const buttonMap = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  lb: 4,
  rb: 5,
  lt: 6,
  rt: 7,
  back: 8,
  start: 9,
  u: 12,
  up: 12,
  d: 13,
  down: 13,
  l: 14,
  left: 14,
  r: 15,
  right: 15,
};

class ButtonSequenceDetector {
  constructor(timeWindow = 1000) {
    this.sequence = [];
    this.timeWindow = timeWindow;
    this.lastInputTime = 0;
    this.buttonStates = Array(16).fill(0); // Track previous state of each button
    // Button mapping for character inputs
  }

  addInput(buttonIndex, buttonValue) {
    const currentTime = Date.now();

    // Only add input on button press (rising edge)
    if (buttonValue === 1 && this.buttonStates[buttonIndex] === 0) {
      // Clear sequence if too much time has passed
      if (currentTime - this.lastInputTime > this.timeWindow) {
        this.sequence = [];
      }

      // Store the button name instead of index
      const buttonName = Object.keys(buttonMap).find((key) => buttonMap[key] === buttonIndex) || buttonIndex.toString();

      this.sequence.push({
        input: buttonName,
        timestamp: currentTime,
      });

      this.lastInputTime = currentTime;

      //console.log(this.sequence);
      // Keep only inputs within the time window
      this.sequence = this.sequence.filter((entry) => currentTime - entry.timestamp <= this.timeWindow);
    }

    // Update button state
    this.buttonStates[buttonIndex] = buttonValue;
  }

  checkSequence(targetSequence) {
    if (!Array.isArray(targetSequence) && typeof targetSequence !== 'string') {
      console.error('ButtonSequenceDetector: targetSequence must be an array or string');
      return 0;
    }

    if (this.sequence.length < targetSequence.length) return 0;

    // Convert string input to array if needed
    const sequence =
      typeof targetSequence === 'string'
        ? targetSequence.toLowerCase().split('')
        : targetSequence.map((s) => s.toString().toLowerCase());

    //console.log(this.sequence);

    // Get the last n inputs where n is the target sequence length
    const lastInputs = this.sequence.slice(-targetSequence.length).map((entry) => entry.input);

    // Compare sequences
    return lastInputs.every((input, index) => {
      const target = sequence[index];
      // Check if either the input matches directly or they refer to the same button in the map
      return (
        input === target ||
        buttonMap[input] === buttonMap[target] ||
        // Also check if the numerical index matches
        buttonMap[input] === parseInt(target)
      );
    })
      ? 1
      : 0;
  }
}

class GamepadHandler {
  constructor(index = 0) {
    // Add index parameter
    this._gamepads = {};
    this._activeGamepad = index; // Use provided index
    this._axes = [0, 0, 0, 0];
    this._buttons = Array(16).fill(0);
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      this._gamepads[e.gamepad.index] = e.gamepad;
      if (!this._activeGamepad) {
        this._activeGamepad = e.gamepad.index;
      }
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      delete this._gamepads[e.gamepad.index];
      if (this._activeGamepad === e.gamepad.index) {
        this._activeGamepad = Object.keys(this._gamepads)[0] || null;
      }
    });
  }

  poll() {
    if (this._activeGamepad !== null) {
      const gamepad = navigator.getGamepads()[this._activeGamepad];
      if (gamepad) {
        // Update axes (normalized to 0-1 range)
        this._axes = gamepad.axes.map((axis) => (axis + 1) / 2);
        // Update buttons
        this._buttons = gamepad.buttons.map((button) => button.value);
      }
    }
  }

  getAxes() {
    return this._axes;
  }
  getButtons() {
    return this._buttons;
  }
}

// Module-level state store for toggle states
const gamepadStates = new Map();

export const gamepad = (index = 0) => {
  const handler = new GamepadHandler(index);
  const sequenceDetector = new ButtonSequenceDetector(2000);

  // Base signal that polls gamepad state and handles sequence detection
  const baseSignal = signal((t) => {
    handler.poll();
    const axes = handler.getAxes();
    const buttons = handler.getButtons();

    // Add all button inputs to sequence detector
    buttons.forEach((value, i) => {
      sequenceDetector.addInput(i, value);
    });

    return { axes, buttons, t };
  });

  // Create axes patterns
  const axes = {
    x1: baseSignal.fmap((state) => state.axes[0]),
    y1: baseSignal.fmap((state) => state.axes[1]),
    x2: baseSignal.fmap((state) => state.axes[2]),
    y2: baseSignal.fmap((state) => state.axes[3]),
  };

  // Add bipolar versions
  axes.x1_2 = axes.x1.toBipolar();
  axes.y1_2 = axes.y1.toBipolar();
  axes.x2_2 = axes.x2.toBipolar();
  axes.y2_2 = axes.y2.toBipolar();

  // Create button patterns
  const buttons = Array(16)
    .fill(null)
    .map((_, i) => {
      // Create unique key for this gamepad+button combination
      const stateKey = `gamepad${index}_btn${i}`;

      // Initialize toggle state if it doesn't exist
      if (!gamepadStates.has(stateKey)) {
        gamepadStates.set(stateKey, {
          lastButtonState: 0,
          toggleState: 0,
        });
      }

      // Direct button value pattern (no longer needs to call addInput)
      const btn = baseSignal.fmap((state) => state.buttons[i]);

      // Button toggle pattern with persistent state
      const toggle = baseSignal.fmap((state) => {
        const currentState = state.buttons[i];
        const buttonState = gamepadStates.get(stateKey);

        if (currentState === 1 && buttonState.lastButtonState === 0) {
          // Toggle the state on rising edge
          buttonState.toggleState = buttonState.toggleState === 0 ? 1 : 0;
        }

        buttonState.lastButtonState = currentState;
        return buttonState.toggleState;
      });

      return { value: btn, toggle };
    });

  // Create sequence checker pattern
  const btnSequence = (sequence) => {
    return baseSignal.fmap(() => sequenceDetector.checkSequence(sequence));
  };
  const checkSequence = btnSequence;
  const btnSeq = btnSequence;
  const btnseq = btnSeq;

  // Return an object with all controls
  return {
    ...axes,
    buttons,
    ...Object.fromEntries(
      Object.entries(buttonMap).flatMap(([key, index]) => [
        [key.toLowerCase(), buttons[index].value],
        [key.toUpperCase(), buttons[index].value],
        [`tgl${key.toLowerCase()}`, buttons[index].toggle],
        [`tgl${key.toUpperCase()}`, buttons[index].toggle],
      ]),
    ),
    checkSequence,
    btnSequence,
    btnSeq,
    btnseq,
    raw: baseSignal,
  };
};

// Optional: Export for debugging or state management
export const getGamepadStates = () => Object.fromEntries(gamepadStates);
export const clearGamepadStates = () => gamepadStates.clear();
