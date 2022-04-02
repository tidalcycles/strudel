---
title: 'Strudel'
date: '2022-03-22'
url2cite: all-links
---

# Introduction

That @roberts2016 are excellent, I reference their work at least twice per sentence [@roberts2016, p. 3]. Another reference [@mclean21].

```javascript
"1 2 3"
```

# Background

General motivations / related work.
Reference vortex paper and summarise its background.

# Introducing TidalStrudel

(do we want to call it TidalStrudel once, and Strudel for short from then on as with vortex? Or just stick with Strudel? Should we start calling TidalCycles just Cycles??)

* Motivating musical example

# Tidal patterns

* Some comparisons of -Strudel with -Vortex and -Cycles code?

(the following examples are from vortex paper, with added js versions)

## 1

```haskell
sound "bd ~ [sd cp]"
```

```python
sound("bd", silence, ["sd", "cp"])
```

```javascript
sound("bd ~ [sd cp]")
```

without mini notation:

```haskell
sound $ cat
   [pure "bd", silence,
    cat(pure "sd", pure "cp")]
```

```javascript
sound('bd', silence, cat('sd', 'cp'))
```

## 2

```haskell
sound "bd ~ <sd cp>"
```

```python
sound("bd", silence, slowcat("sd", "cp"))
```

```javascript
sound("bd ~ <sd cp>")
// sound('bd', silence, slowcat('sd', 'cp'))
```

## 3

```haskell
sound "bd {cp sd, lt mt ht}"
```

```python
sound("bd", pm(["cp", "sd"], ["lt", "mt", "ht"]))
```

```js
?
```

## 4

```haskell
sound "bd {cp sd, [lt mt,bd bd bd] ht}"
```

```python
 sound("bd", pm(["cp", "sd"],
 [pr(["lt", "mt"],
 ["bd", "bd", "bd"]
 ),
 "ht" ]))
```

```js
??
```

## 5

```haskell
sound "bd sd cp" # speed "1 2"
```

```python
sound("bd", "sd", "cp") >> speed (1, 2)
```

```javascript
sound("bd sd cp").speed("1 2")
```

(operator overloading like in vortex?)

## 6

```haskell
rev $ sound "bd sd"
```

```python
rev(sound("bd", "sd"))
sound("bd", "sd").rev()
```

```javascript
rev(sound("bd sd"))
sound("bd sd").rev()
```

## 7

```haskell
jux rev $ every 3 (fast 2) $ sound "bd sd"
```

```python
jux(rev, every(3, fast(2), sound("bd", "sd")))
sound("bd","sd").every(3, fast(2)).jux(rev)
```

```js
jux(rev, every(3, fast(2), sound("bd sd")))
sound("bd sd").every(3, fast(2)).jux(rev)
```

(partial application)

## 8

```haskell
n ("1 2 3" + "4 5") # sound "drum"
```

```python
n (sequence(1,2,3) + sequence(4,5)) >> sound "drum"
```

```js
n("1 2 3".add("4 5")).sound("drum")
n("5 [6 7] 8").sound("drum")
```

(operator overloading?)

## 9

```haskell
speed("1 2 3" + sine)
```

```python
speed(sequence(1,2,3) + sine)
```

```js
speed("1 2 3".add(sine))
"c3*4".add(sine.mul(12).slow(8)).pianoroll()
```

## 10

* Mininotation

# Strudel/web specifics

Some discussion about whether strudel is really a port of TidalCycles, or whether javascript affordances mean it's going its own way..

* Recursive Scheduling: "calling itself in the future"
* Optimizing Syntax for minimal keystrokes / readability: "AST Hacking" via shift-ast
pseudo variables
  * Handling mininotation - double quoted and template strings to mini calls
  * Operator overloading
* Fixing inconsistencies (e.g. with stut/echo)
adding source locations
* Dynamic HUD: Highlighting + drawing
* Translation of Tidal concepts to Javascript - different constraints, affordances, aesthetics
* Dynamic Harmonic Programming?
* emulating musician thought patterns
* microtonal features?
webserial

# Musical examples

...

# Ongoing work/future aims

* WASM Sound Backend
* OSC -> Supercollider
* mininotation as the 'regex' of metre

# References

[@roberts2016]: https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode=rpdm20
[@mclean21]: https://zenodo.org/record/5788732
