# Strudel Functional Programming Reference

## Core Philosophy: Functions that Transform Patterns

Strudel follows **functional programming** like SuperCollider/Tidal Cycles. Patterns are **immutable functions** that get transformed by chaining other functions.

## Pattern Construction & Chaining

**Basic Structure:**
```javascript
// Functions chain left-to-right, each returns new transformed pattern
sound("bd hh sd oh").bank("RolandTR909").cpm(60)
note("c e g b").sound("piano").lpf(800).room(0.5)
```

**Key Principles:**
1. **Each function returns a new pattern** - immutable transformations
2. **Order matters** - functions applied left-to-right
3. **Patterns are pure functions** - take time spans, return events
4. **Think declaratively** - describe what you want, not how

## Parallel Patterns

**Multiple patterns play simultaneously with `$:`:**
```javascript
$: sound("bd ~ sd ~").bank("RolandTR909")     // kick/snare
$: sound("hh*8").bank("RolandTR909")          // hi-hats
$: note("c eb g bb").sound("sawtooth")        // bass line

// Alternative: stack() function
$: stack(
  sound("bd ~ sd ~"),
  sound("hh*8"),
  note("c eb g bb").sound("sawtooth")
)

// Mute patterns with _$:
_$: sound("crash")  // muted
```

## Mini-Notation Pattern Language

**Core Elements:**
- **Sequences**: `"bd hh sd oh"` - events divided equally
- **Rests**: `"bd ~ sd ~"` or `"bd - sd -"` (identical)
- **Sub-sequences**: `"bd [hh hh] sd hh"` - nested timing
- **Parallel**: `"bd hh, rim cp"` - simultaneous events
- **Alternation**: `"<bd sd hh>"` - one per cycle
- **Speed up**: `"bd*4"` or `"[bd sd]*2"`
- **Slow down**: `"[bd sd]/2"` - spans multiple cycles

**Advanced Patterns:**
```javascript
sound("bd(3,8)")     // Euclidean: 3 beats over 8 steps
note("c@3 e")        // Elongation: c is 3x longer
note("c!3 e")        // Replication: c repeats 3 times
sound("jazz:0 jazz:1") // Sample selection
```

## Sound Generation

**Synths vs Samples:**
```javascript
// Synths (generated)
note("c e g b").sound("sawtooth")
note("60 64 67").sound("triangle")

// Samples (pre-recorded)
sound("bd hh sd oh")
n("0 1 2").sound("jazz")
```

## Effects as Functions

**Chain effects functionally:**
```javascript
note("c2 c3").sound("sawtooth")
  .lpf(800)           // low-pass filter
  .delay(0.5)         // delay
  .room(0.3)          // reverb
  .gain(0.7)          // volume

// Effects can have patterns as arguments
.lpf("400 800 1200")    // filter sweeps
.pan("0 0.5 1")         // stereo movement
```

## Pattern Transformations

**Functional transformations:**
```javascript
sound("bd hh sd oh").rev()                    // reverse
sound("bd hh sd oh").jux(rev)                 // left/right split
note("c e g").add("0 2 4")                   // add intervals
sound("bd sd").off(1/8, x => x.speed(2))     // time offset
sound("bd sd").ply(2)                        // multiply events
```

## Scales and Musical Theory

**Scale-based composition:**
```javascript
// Use numbers with scales
n("0 2 4 6").scale("C:minor").sound("piano")
n("<0 2 4> <1 3 5>").scale("<C:major D:dorian>/4")
```

## Signal-Based Modulation

**Continuous control with signals:**
```javascript
sound("hh*16").gain(sine)                     // sine wave 0-1
sound("hh*16").lpf(saw.range(200,2000))       // sawtooth sweep
.lpf(sine.slow(4).range(500,3000))            // slow sine wave
```

## Common Patterns

**Basic 909 Kick/Clap:**
```javascript
$: sound("bd ~ sd ~").bank("RolandTR909")
```

**Casio Melody:**
```javascript
$: note("[c - - - c - - - c - - - c - - -][c c c c c c c c c c c c c c").sound("casio")
```

**Complex Polyrhythm:**
```javascript
$: sound("bd(3,8)")
$: sound("hh*4").degradeBy(0.2)
$: note("0 2 4".scale("C minor")).struct("x(5,8)")
```

## Key Functional Concepts

1. **Immutability**: Patterns never change, functions create new ones
2. **Composition**: Complex patterns from chaining simple functions
3. **Pure Functions**: No side effects, predictable output
4. **Time as Input**: Patterns are functions taking time, returning events
5. **Declarative**: Describe what you want, not how to achieve it

This functional approach enables powerful live coding - continuously transform patterns by chaining functions to create evolving musical structures.