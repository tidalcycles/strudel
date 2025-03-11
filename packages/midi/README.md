# @strudel/midi

This package adds midi functionality to strudel Patterns.

## Install

```sh
npm i @strudel/midi --save
```

## Available Controls

The following MIDI controls are available:

OUTPUT:

- `midi` - opens a midi output device.
- `note` - Sends MIDI note messages. Can accept note names (e.g. "c4") or MIDI note numbers (0-127)
- `midichan` - Sets the MIDI channel (1-16, defaults to 1)
- `velocity` - Sets note velocity (0-1, defaults to 0.9)
- `gain` - Modifies velocity by multiplying with it (0-1, defaults to 1)
- `control` - Sets MIDI control change messages
- `ccn` - Sets MIDI CC controller number (0-127)
- `ccv` - Sets MIDI CC value (0-1)
- `progNum` - Sends MIDI program change messages (0-127)
- `sysex` - Sends MIDI System Exclusive messages (id: number 0-127 or array of bytes 0-127, data: array of bytes 0-127)
- `sysexid` - Sets MIDI System Exclusive ID (number 0-127 or array of bytes 0-127)
- `sysexdata` - Sets MIDI System Exclusive data (array of bytes 0-127)
- `midibend` - Sets MIDI pitch bend (-1 - 1)
- `miditouch` - Sets MIDI key after touch (0-1)
- `midicmd` - Sends MIDI system real-time messages to control timing and transport on MIDI devices.
- `nrpnn` - Sets MIDI NRPN non-registered parameter number (array of bytes 0-127)
- `nrpv` - Sets MIDI NRPN non-registered parameter value (0-127)


INPUT:

- `midin` - Opens a MIDI input port to receive MIDI control change messages.

Additional controls can be mapped using the mapping object passed to `.midi()`:

## Examples

### midi(outputName?, options?)

Either connect a midi device or use the IAC Driver (Mac) or Midi Through Port (Linux) for internal midi messages.
If no outputName is given, it uses the first midi output it finds.

```javascript
$: chord("<C^7 A7 Dm7 G7>").voicing().midi('IAC Driver')
```

In the console, you will see a log of the available MIDI devices as soon as you run the code, e.g. `Midi connected! Using "Midi Through Port-0".`

### Options

The `.midi()` function accepts an options object with the following properties:

```javascript
$: note("c a f e").midi('IAC Driver', { isController: true, midimap: 'default'})
```

<details>
<summary>Available Options</summary>

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| isController | boolean | false | When true, disables sending note messages. Useful for MIDI controllers |
| latencyMs | number | 34 | Latency in milliseconds to align MIDI with audio engine |
| noteOffsetMs | number | 10 | Offset in milliseconds for note-off messages to prevent glitching |
| midichannel | number | 1 | Default MIDI channel (1-16) |
| velocity | number | 0.9 | Default note velocity (0-1) |
| gain | number | 1 | Default gain multiplier for velocity (0-1) |
| midimap | string | 'default' | Name of MIDI mapping to use for control changes |
| midiport | string/number | - | MIDI device name or index |

</details>




### midiport(outputName)

Selects the MIDI output device to use, pattern can be used to switch between devices.

```javascript
$: midiport('IAC Driver')
$: note("c a f e").midiport("<0 1 2 3>").midi()
```

### midichan(number)

Selects the MIDI channel to use. If not used, `.midi` will use channel 1 by default.

### control, ccn && ccv

`control` sends MIDI control change messages to your MIDI device.

- `ccn` sets the cc number. Depends on your synths midi mapping
- `ccv` sets the cc value. normalized from 0 to 1.

```javascript
$: note("c a f e").control([74, sine.slow(4)]).midi()
$: note("c a f e").ccn(74).ccv(sine.slow(4)).midi()
```

In the above snippet, `ccn` is set to 74, which is the filter cutoff for many synths. `ccv` is controlled by a saw pattern.
Having everything in one pattern, the `ccv` pattern will be aligned to the note pattern, because the structure comes from the left by default.
But you can also control cc messages separately like this:

```javascript
$: note("c a f e").midi()
$: ccv(sine.segment(16).slow(4)).ccn(74).midi()
```

### progNum (Program Change)

`progNum` control sends MIDI program change messages to switch between different presets/patches on your MIDI device.
Program change values should be numbers between 0 and 127.

```javascript
// Play notes while changing programs
note("c3 e3 g3").progNum("<0 1 2>").midi()
```

Program change messages are useful for switching between different instrument sounds or presets during a performance. 
The exact sound that each program number maps to depends on your MIDI device's configuration.

## sysex,  sysexid && sysexdata (System Exclusive Message)

`sysex`, `sysexid` and `sysexdata` control sends MIDI System Exclusive (SysEx) messages to your MIDI device. 
sysEx messages are device-specific commands that allow deeper control over synthesizer parameters. 
The value should be an array of numbers between 0-255 representing the SysEx data bytes.

```javascript
// Send a simple SysEx message
let id = 0x43; //Yamaha
//let id = "0x00:0x20:0x32"; //Behringer ID can be an array of numbers
let data = "0x79:0x09:0x11:0x0A:0x00:0x00"; // Set NSX-39 voice to say "Aa"
$: note("c d e f e d c").sysex(id, data).midi();
$: note("c d e f e d c").sysexid(id).sysexdata(data).midi();
```

The exact format of SysEx messages depends on your MIDI device's specification.
Consult your device's MIDI implementation guide for details on supported SysEx messages.

### midibend && miditouch

`midibend` sets MIDI pitch bend (-1 - 1)
`miditouch` sets MIDI key after touch (0-1)

```javascript

$: note("c d e f e d c").midibend(sine.slow(4).range(-0.4,0.4)).midi();
$: note("c d e f e d c").miditouch(sine.slow(4).range(0,1)).midi();

```

### midicmd

`midicmd` sends MIDI system real-time messages to control timing and transport on MIDI devices.

It supports the following commands:

- `clock`/`midiClock` - Sends MIDI timing clock messages
- `start` - Sends MIDI start message
- `stop` - Sends MIDI stop message
- `continue` - Sends MIDI continue message

```javascript
// You can control the clock with a pattern and ensure it starts in sync when the repl begins.
// Note: It might act unexpectedly if MIDI isn't set up initially.
stack(
  midicmd("clock*48,<start stop>/2").midi('IAC Driver') 
)
```

`midicmd` also supports sending control change, program change and sysex messages.

- `cc` - sends MIDI control change messages.
- `progNum` - sends MIDI program change messages.
- `sysex` - sends MIDI system exclusive messages.

```javascript
stack(
  // "cc:ccn:ccv"
  midicmd("cc:74:1").midi('IAC Driver'),
  // "progNum:progNum"
  midicmd("progNum:1").midi('IAC Driver'),
  // "sysex:[sysexid]:[sysexdata]"
  midicmd("sysex:[0x43]:[0x79:0x09:0x11:0x0A:0x00:0x00]").midi('IAC Driver')
)
```