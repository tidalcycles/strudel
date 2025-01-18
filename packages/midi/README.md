# @strudel/midi

This package adds midi functionality to strudel Patterns.

## Install

```sh
npm i @strudel/midi --save
```


## Available Controls

The following MIDI controls are available:

- `note` - Sends MIDI note messages. Can accept note names (e.g. "c4") or MIDI note numbers (0-127)
- `midichan` - Sets the MIDI channel (1-16, defaults to 1)
- `velocity` - Sets note velocity (0-1, defaults to 0.9)
- `gain` - Modifies velocity by multiplying with it (0-1, defaults to 1)
- `ccn` - Sets MIDI CC controller number (0-127)
- `ccv` - Sets MIDI CC value (0-1)
- `pc` - Sends MIDI program change messages (0-127)
- `sysex` - Sends MIDI System Exclusive messages (array of bytes 0-255)

Additional controls can be mapped using the mapping object passed to `.midi()`:


## Examples

### midi(outputName?)

Either connect a midi device or use the IAC Driver (Mac) or Midi Through Port (Linux) for internal midi messages.
If no outputName is given, it uses the first midi output it finds.

```javascript
$: chord("<C^7 A7 Dm7 G7>").voicing().midi()
```

In the console, you will see a log of the available MIDI devices as soon as you run the code, e.g. `Midi connected! Using "Midi Through Port-0".`

### midichan(number)

Selects the MIDI channel to use. If not used, `.midi` will use channel 1 by default.

### ccn && ccv

- `ccn` sets the cc number. Depends on your synths midi mapping
- `ccv` sets the cc value. normalized from 0 to 1.

```javascript
$: note("c a f e").ccn(74).ccv(sine.slow(4)).midi()
```

In the above snippet, `ccn` is set to 74, which is the filter cutoff for many synths. `ccv` is controlled by a saw pattern.
Having everything in one pattern, the `ccv` pattern will be aligned to the note pattern, because the structure comes from the left by default.
But you can also control cc messages separately like this:

```javascript
$: note("c a f e").midi()
$: ccv(sine.segment(16).slow(4)).ccn(74).midi()
```

### pc (Program Change)

The `pc` control sends MIDI program change messages to switch between different presets/patches on your MIDI device. 
Program change values should be numbers between 0 and 127.

```javascript
// Play notes while changing programs
note("c3 e3 g3").pc("<0 1 2>").midi()
```

Program change messages are useful for switching between different instrument sounds or presets during a performance. 
The exact sound that each program number maps to depends on your MIDI device's configuration.

## sysex (System Exclusive Message)

The `sysex` control sends MIDI System Exclusive (SysEx) messages to your MIDI device. 
sysEx messages are device-specific commands that allow deeper control over synthesizer parameters. 
The value should be an array of numbers between 0-255 representing the SysEx data bytes.

```javascript
// Send a simple SysEx message
let id = 0x43; //Yamaha
//let id = "0x00:0x20:0x32"; //Behringer ID can be an array of numbers

let data = "0x79:0x09:0x11:0x0A:0x00:0x00"; // Set NSX-39 voice to say "Aa"

note("c d e f e d c").sysex(id, data).midi();
```

The exact format of SysEx messages depends on your MIDI device's specification. 
Consult your device's MIDI implementation guide for details on supported SysEx messages.