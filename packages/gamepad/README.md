# @strudel/gamepad

This package adds gamepad input functionality to strudel Patterns.

## Install

```sh
npm i @strudel/gamepad --save
```

## Usage

```javascript
import { gamepad } from '@strudel/gamepad';

// Initialize gamepad (optional index parameter, defaults to 0)
const pad = gamepad(0);

// Use gamepad inputs in patterns
const pattern = sequence([
  // Button inputs
  pad.a,        // A button value (0-1)
  pad.tglA,     // A button toggle (0 or 1)
  
  // Analog stick inputs
  pad.x1,       // Left stick X (0-1)
  pad.x1_2,     // Left stick X (-1 to 1)
]);
```

## Available Controls

### Buttons
- Face Buttons
  - `a`, `b`, `x`, `y` (or uppercase `A`, `B`, `X`, `Y`)
  - Toggle versions: `tglA`, `tglB`, `tglX`, `tglY`
- Shoulder Buttons
  - `lb`, `rb`, `lt`, `rt` (or uppercase `LB`, `RB`, `LT`, `RT`)
  - Toggle versions: `tglLB`, `tglRB`, `tglLT`, `tglRT`
- D-Pad
  - `up`, `down`, `left`, `right` (or `u`, `d`, `l`, `r` or uppercase)
  - Toggle versions: `tglUp`, `tglDown`, `tglLeft`, `tglRight`(or `tglU`, `tglD`, `tglL`, `tglR`)

### Analog Sticks
- Left Stick
  - `x1`, `y1` (0 to 1 range)
  - `x1_2`, `y1_2` (-1 to 1 range)
- Right Stick
  - `x2`, `y2` (0 to 1 range)
  - `x2_2`, `y2_2` (-1 to 1 range)

## Examples

```javascript
// Use button values to control amplitude
$: sequence([
  s("bd").gain(pad.X),    // X button controls gain
  s("[hh oh]").gain(pad.tglY),    // Y button toggles gain
]);

// Use analog stick for continuous control
$: note("c4*4".add(pad.y1_2.range(-24,24))) // Left stick Y controls pitch shift
  .pan(pad.x1_2);          // Left stick X controls panning

// Use toggle buttons to switch patterns on/off

// Define button sequences
const HADOKEN = [
  'd',               // Down
  'r',               // Right
  'a',               // A
];

const KONAMI = 'uuddlrlrba' //Konami Code ↑↑↓↓←→←→BA

// Add these lines to enable buttons(but why?)
$:pad.D.segment(16).gain(0)
$:pad.R.segment(16).gain(0)
$:pad.A.segment(16).gain(0)

// Check button sequence (returns 1 when detected, 0 when not within last 1 second)
$: sound("hadoken").gain(pad.checkSequence(HADOKEN))

```

## Multiple Gamepads

You can connect multiple gamepads by specifying the gamepad index:

```javascript
const pad1 = gamepad(0);  // First gamepad
const pad2 = gamepad(1);  // Second gamepad
```
