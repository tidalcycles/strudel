---
date: 2022-03-22
references:
- abstract: In this artist statement, I will discuss the tension between
    source code as an interactive system for performers and source code
    as information and entertainment for audiences in live-coding
    performances. I then describe augmentations I developed for the
    presentation of source code in the live-coding environment Gibber,
    including animations and annotations that visually reveal aspects of
    system state during performances. I briefly describe audience
    responses to these techniques and, more importantly, how they are
    critical to my own artistic practice.
  accessed:
    date-parts:
    - - 2022
      - 3
      - 24
  author:
  - family: Roberts
    given: Charles
  container-title: International Journal of Performance Arts and Digital
    Media
  DOI: 10.1080/14794713.2016.1227602
  id: "https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode_x61_rpdm20"
  ISSN: 1479-4713
  issue: 2
  issued:
    date-parts:
    - - 2016
      - 7
  keyword: Live coding, psychology of programming, notation, audiences,
    algorithms
  page: 201-206
  title: Code as information and code as spectacle
  type: article-journal
  URL: "https://doi.org/10.1080/14794713.2016.1227602"
  volume: 12
- abstract: The TidalCycles (or Tidal for short) live coding environment
    has been developed since around 2009, via several rewrites of its
    core representation. Rather than having fixed goals, this
    development has been guided by use, motivated by the open aim to
    make music. This development process can be seen as a long-form
    improvisation, with insights into the nature of Tidal gained through
    the process of writing it, feeding back to guide the next steps of
    development. This brings the worrying thought that key insights will
    have been missed along this development journey, that would
    otherwise have lead to very different software. Indeed participants
    at beginners' workshops that I have lead or co-lead have often asked
    questions without good answers, because they made deficiencies or
    missing features in the software clear. It is well known that a
    beginner's mind is able to see much that an expert has become blind
    to. Running workshops are an excellent way to find new development
    ideas, but the present paper explores a different technique -- the
    rewrite.
  accessed:
    date-parts:
    - - 2022
      - 3
      - 24
  id: "https://zenodo.org/record/5788732"
  issued:
    date-parts:
    - - 2021
      - 12
  keyword: live coding, algorithmic pattern, tidalcycles, haskell,
    python
  publisher-place: Valdivia, Chile
  title: Alternate Timelines for TidalCycles
  URL: "https://zenodo.org/record/5788732"
- abstract: A JavaScript dialect of its mini-notation for pattern is
    created, enabling easy integration with creative coding tools and an
    accompanying technique for visually annotating the playback of
    TidalCycles patterns over time. TidalCycles has rapidly become the
    most popular system for many styles of live coding performance, in
    particular Algoraves. We created a JavaScript dialect of its
    mini-notation for pattern, enabling easy integration with creative
    coding tools. Our research pairs a formalism describing the
    mini-notation with a small JavaScript library for generating events
    over time; this library is suitable for generating events inside of
    an AudioWorkletProcessor thread and for assisting with scheduling in
    JavaScript environments more generally. We describe integrating the
    library into the two live coding systems, Gibber and Hydra, and
    discuss an accompanying technique for visually annotating the
    playback of TidalCycles patterns over time.
  accessed:
    date-parts:
    - - 2022
      - 4
      - 12
  author:
  - family: Roberts
    given: Charles
  container-title: www.semanticscholar.org
  id: "https://www.semanticscholar.org/paper/Bringing-the-TidalCycles-Mini-Notation-to-the-Roberts/74965efadd572ae3f40d14c633a5c8581c1b9f42"
  issued:
    date-parts:
    - - 2019
  title: Bringing the TidalCycles Mini-Notation to the Browser
  URL: "https://www.semanticscholar.org/paper/Bringing-the-TidalCycles-Mini-Notation-to-the-Roberts/74965efadd572ae3f40d14c633a5c8581c1b9f42"
title: Strudel
url2cite: all-links
---

# Introduction

This paper introduces Strudel, an alternative implementation of the
TidalCycles live coding system, using the JavaScript programming
language.

# Background

General motivations / related work. Reference vortex paper and summarise
its background.

The reimplementation of TidalCycles in Python (cite TidalVortex) showed
that it is possible to translate pure functional reactive programming
ideas to a multi paradigm language. It proved to be a stepping stone to
move to other multi-paradigm languages, like JavaScript. A significant
part of of the Python codebase could be ported to JavaScript by
syntactical adjustments.

# Introducing TidalStrudel

(do we want to call it TidalStrudel once, and Strudel for short from
then on as with vortex? Or just stick with Strudel? Should we start
calling TidalCycles just Cycles?? froos: I think TidalStrudel sounds a
bit weird, but we can stick to the TidalX naming scheme if that's
important. For me, StrudelCycles sounds better, because it has 3/4
phonems in common with TidalCycles)

-   Motivating musical example

# Tidal patterns

(should we explain shortly what tidal patterns do in general here?)

The essence of TidalCycles are Patterns. Patterns are abstract entities
that represent flows of time. Taking a time span as its input, a Pattern
can output a set of events that happen within that time span. It depends
on the structure of the Pattern where the events are placed. From now
on, this process of generating events from a time span will be called
**querying**. Example:

<MiniRepl tune={`const pattern = sequence(c3, [e3, g3]);
const events = pattern.query(0, 1);
console.log(events.map(e => e.show()))`} />

In this example, we create a pattern using the `sequence` function and
**query** it for the timespan from `0` to `1`. Those numbers represent
units of time called **cycles**. The length of one cycle defaults to one
second, but could be any number of seconds. The console output looks
like this:

<MiniRepl tune={`(0   -> 1/2 c3)
(1/2 -> 3/4 e3)
(3/2 -> 1   g3)`} />

In this output, each line represents one event. The two fractions
represent the begin and end time of the event, followed by its value. In
this case, the events are placed in sequential order, where c3 takes the
first half, and e3 and g3 together take the second half. This temporal
placement is the result of the `sequence` function, which divides its
arguments equally over one cycle. If an argument is an array, the same
rule applies to that part of the sequence. In our example e3 and g3 are
divided equally over the second half of the whole sequence.

# Mini Notation

In this example, the Pattern is created using the `mini` function, which
parses Tidal's Mini Notation. The Mini Notation is a Domain Specific
Language (DSL) that allows expressing rhythms in a short mannger.

-   Some comparisons of -Strudel with -Vortex and -Cycles code?

(the following examples are from vortex paper, with added js versions)

## 1

<MiniRepl tune={`sound "bd ~ [sd cp]"`} />
<MiniRepl tune={`sound("bd", silence, ["sd", "cp"])`} />
<MiniRepl tune={`sound("bd ~ [sd cp]")`} />

without mini notation:

<MiniRepl tune={`sound $ cat
   [pure "bd", silence,
    cat(pure "sd", pure "cp")]`} />
<MiniRepl tune={`sound('bd', silence, cat('sd', 'cp'))`} />

## 2

<MiniRepl tune={`sound "bd ~ <sd cp>"`} />
<MiniRepl tune={`sound("bd", silence, slowcat("sd", "cp"))`} />
<MiniRepl tune={`sound("bd ~ <sd cp>")
// sound('bd', silence, slowcat('sd', 'cp'))`} />

## 3

<MiniRepl tune={`sound "bd {cp sd, lt mt ht}"`} />
<MiniRepl tune={`sound("bd", pm(["cp", "sd"], ["lt", "mt", "ht"]))`} />
<MiniRepl tune={`?`} />

## 4

<MiniRepl tune={`sound "bd {cp sd, [lt mt,bd bd bd] ht}"`} />
<MiniRepl tune={` sound("bd", pm(["cp", "sd"],
 [pr(["lt", "mt"],
 ["bd", "bd", "bd"]
 ),
 "ht" ]))`} />
<MiniRepl tune={`??`} />

## 5

<MiniRepl tune={`sound "bd sd cp" # speed "1 2"`} />
<MiniRepl tune={`sound("bd", "sd", "cp") >> speed (1, 2)`} />
<MiniRepl tune={`sound("bd sd cp").speed("1 2")`} />

(operator overloading like in vortex?)

## 6

<MiniRepl tune={`rev $ sound "bd sd"`} />
<MiniRepl tune={`rev(sound("bd", "sd"))
sound("bd", "sd").rev()`} />
<MiniRepl tune={`rev(sound("bd sd"))
sound("bd sd").rev()`} />

## 7

<MiniRepl tune={`jux rev $ every 3 (fast 2) $ sound "bd sd"`} />
<MiniRepl tune={`jux(rev, every(3, fast(2), sound("bd", "sd")))
sound("bd","sd").every(3, fast(2)).jux(rev)`} />
<MiniRepl tune={`jux(rev, every(3, fast(2), sound("bd sd")))
sound("bd sd").every(3, fast(2)).jux(rev)`} />

(partial application)

## 8

<MiniRepl tune={`n ("1 2 3" + "4 5") # sound "drum"`} />
<MiniRepl tune={`n (sequence(1,2,3) + sequence(4,5)) >> sound "drum"`} />
<MiniRepl tune={`n("1 2 3".add("4 5")).sound("drum")
n("5 [6 7] 8").sound("drum")`} />

(operator overloading?)

## 9

<MiniRepl tune={`speed("1 2 3" + sine)`} />
<MiniRepl tune={`speed(sequence(1,2,3) + sine)`} />
<MiniRepl tune={`speed("1 2 3".add(sine))
"c3*4".add(sine.mul(12).slow(8)).pianoroll()`} />

## 10

-   Mininotation

# Strudel/web specifics

Some discussion about whether strudel is really a port of TidalCycles,
or whether javascript affordances mean it's going its own way..

-   Recursive Scheduling: "calling itself in the future"
-   Optimizing Syntax for minimal keystrokes / readability: "AST
    Hacking" via shift-ast pseudo variables
    -   Handling mininotation - double quoted and template strings to
        mini calls
    -   Operator overloading
-   Fixing inconsistencies (e.g. with stut/echo) adding source locations
-   Dynamic HUD: Highlighting + drawing
-   Translation of Tidal concepts to Javascript - different constraints,
    affordances, aesthetics
-   Dynamic Harmonic Programming?
-   emulating musician thought patterns
-   microtonal features? webserial

## User Code Transpilation

(compare user input vs shifted output)

### double quotes -\> mini calls

<MiniRepl tune={`"c3 e3" // or `c3 e3``} />
<MiniRepl tune={`mini("c3 e3")`} />

### operator overloading

<MiniRepl tune={`cat(c3, e3) * 4`} />
<MiniRepl tune={`reify(cat("c3","e3")).fast(4)`} />

(reify is redundant here, the shapeshifter could have an additional
check...)

(TBD: ability to multiply mini notation strings)

### pseudo variables

<MiniRepl tune={`cat(c3, r, e3)`} />
<MiniRepl tune={`cat("c3",silence,"e3")`} />

### locations

<MiniRepl tune={`cat(c3, e3)`} />
<MiniRepl tune={`cat(
  reify("c3").withLocation([1,4,4],[1,6,6]),
  reify("e3").withLocation([1,8,8],[1,10,10])
)`} />
<MiniRepl tune={`mini("c3 e3")`} />

with locations:

<MiniRepl tune={`// "c3 e3"
mini("c3 e3").withMiniLocation([1,0,0],[1,7,7])`} />

(talk about mini adding locations of mini notation parser)

### top level await

<MiniRepl tune={`const p = (await piano()).toDestination()
cat(c3).tone(p)`} />
<MiniRepl tune={`(async()=>{
  const p = (await piano()).toDestination();
  return cat("c3").tone(p);
})()`} />

# Musical examples

...

# Ongoing work/future aims

-   WASM Sound Backend
-   OSC -\> Supercollider
-   mininotation as the 'regex' of metre

That
@https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode_x61_rpdm20
are excellent, I reference their work at least twice per sentence
[@https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode_x61_rpdm20,
p. 3]. Another reference [@https://zenodo.org/record/5788732].

<MiniRepl tune={`"1 2 3"`} />

# References

-   gibber
-   krill
-   glicol
