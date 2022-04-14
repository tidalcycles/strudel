---
title: 'StrudelCycles: live coding algorithmic patterns on the web'
date: '2022-03-22'
url2cite: all-links
---

# Introduction

This paper introduces Strudel, an alternative implementation of the TidalCycles live coding system, using the JavaScript programming language.

# Background

TidalCycles (or *Tidal* for short) has been developed since around 2009, as a system for live coding algorithmic patterns, particularly in music [@tidalcycles]. Tidal is embedded in the pure functional *Haskell* programming language, taking advantage of its terse syntax and advanced type system. Over the past decade, Tidal has undergone a number of re-writes, developing a functional reactive representation of pattern, where patterns may be combined and transformed in a wide variety of ways [@alternate-timelines]. Over this time is has gained diverse ideas from other patterned forms, including from computer music [@spiegel], Indian classical music [@bel], textiles [@fabricating], improvised percussion [@hession], and Ancient Greek lyric [@cyclic-patterns]. 

Most recently, attention has turned to transferring Tidal's ideas to other, less 'pure' languages; firstly, to the Python programming language as *TidalVortex* [@tidalvortex] (*Vortex* for short), and now to JavaScript as StrudelCycles (*Strudel* for short), the topic of the present paper. For general background on the motivations for porting Tidal to a multi-paradigm programming language, please see the TidalVortex paper [@tidalvortex]. The motivations for porting it to JavaScript are similar, with a particular slanting on accessibility - of course, a web browser based application does not require any installation. As with Vortex though, it is important to point out that this is a creative, free/open source project, and as such, an primary motivation will always be developer's curiosity, and market-driven perspectives on development choices may even be demotivational.

General motivations / related work.
Reference vortex paper and summarise its background.

The reimplementation of TidalCycles in Python (cite TidalVortex) showed that it is possible to translate pure functional reactive programming ideas to a multi paradigm language. It proved to be a stepping stone to move to other multi-paradigm languages, like JavaScript. A significant part of of the Python codebase could be quickly ported to JavaScript by syntactical adjustments.

# Introducing Strudel

* Motivating musical example

# Tidal patterns

(should we explain shortly what tidal patterns do in general here?)

The essence of TidalCycles are Patterns. Patterns are abstract entities that represent flows of time, supporting both continuous changes (like signals) and discrete events (like notes).
Taking a time span as its input, a Pattern can output a set of events that happen within that time span.
It depends on the structure of the Pattern where the events are placed.
From now on, this process of generating events from a time span will be called **querying**.
Example:

```js
const pattern = sequence(c3, [e3, g3]);
const events = pattern.query(0, 1);
console.log(events.map(e => e.show()))
```

In this example, we create a pattern using the `sequence` function and **query** it for the timespan from `0` to `1`.
Those numbers represent units of time called **cycles**. The length of one cycle defaults to one second, but could be any number of seconds.
The console output looks like this:

```js
(0   -> 1/2 c3)
(1/2 -> 3/4 e3)
(3/2 -> 1   g3)
```

In this output, each line represents one event. The two fractions represent the begin and end time of the event, followed by its value.
In this case, the events are placed in sequential order, where c3 takes the first half, and e3 and g3 together take the second half.
This temporal placement is the result of the `sequence` function, which divides its arguments equally over one cycle.
If an argument is an array, the same rule applies to that part of the sequence. In our example e3 and g3 are divided equally over the second half of the whole sequence.

# Mini Notation

In this example, the Pattern is created using the `mini` function, which parses Tidal's Mini Notation.
The Mini Notation is a Domain Specific Language (DSL) that allows expressing rhythms in a short mannger.

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

## User Code Transpilation

(compare user input vs shifted output)

### double quotes -> mini calls

```javascript
"c3 e3" // or `c3 e3`
```

```javascript
mini("c3 e3")
```

### operator overloading

```javascript
cat(c3, e3) * 4
```

```javascript
reify(cat("c3","e3")).fast(4)
```

(reify is redundant here, the shapeshifter could have an additional check...)

(TBD: ability to multiply mini notation strings)

### pseudo variables

```javascript
cat(c3, r, e3)
```

```javascript
cat("c3",silence,"e3")
```

### locations

```javascript
cat(c3, e3)
```

```javascript
cat(
  reify("c3").withLocation([1,4,4],[1,6,6]),
  reify("e3").withLocation([1,8,8],[1,10,10])
)
```

```javascript
mini("c3 e3")
```

with locations:

```javascript
// "c3 e3"
mini("c3 e3").withMiniLocation([1,0,0],[1,7,7])
```

(talk about mini adding locations of mini notation parser)

### top level await

```javascript
const p = (await piano()).toDestination()
cat(c3).tone(p)
```

```javascript
(async()=>{
  const p = (await piano()).toDestination();
  return cat("c3").tone(p);
})()
```

# Musical examples

...

# Ongoing work/future aims

* WASM Sound Backend
* OSC -> Supercollider
* mininotation as the 'regex' of metre

That @roberts2016 are excellent, I reference their work at least twice per sentence [@roberts2016, p. 3]. 

```javascript
"1 2 3"
```

# References

[@roberts2016]: https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode=rpdm20
[@alternate-timelines]: https://zenodo.org/record/5788732
[@tidal.pegjs]: https://www.semanticscholar.org/paper/Bringing-the-TidalCycles-Mini-Notation-to-the-Roberts/74965efadd572ae3f40d14c633a5c8581c1b9f42
[@tidalvortex]: https://zenodo.org/record/6456380
[@ogborn17]: https://www.semanticscholar.org/paper/Estuary%3A-Browser-based-Collaborative-Projectional-Ogborn-Beverley/c6b5d34575d6230dfd8751ca4af8e5f6e44d916b
[@tidalcycles]: https://dl.acm.org/doi/10.1145/2633638.2633647
[@hession]: https://www.scopus.com/record/display.uri?eid=2-s2.0-84907386880&origin=inward&txGid=03307e26fba02a27bdc68bda462016f6266316467_Extending_Instruments_with_Live_Algorithms_in_a_Percussion_Code_Duo
[@spiegel]: https://www.academia.edu/664807/Manipulations_of_musical_patterns
[@bel]: https://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.517.7129
[@algorithmicpattern]: https://zenodo.org/record/4299661
[@fabricating]: https://zenodo.org/record/2155745
[@cyclic-patterns]: https://zenodo.org/record/1548969

- gibber
- krill
- glicol
