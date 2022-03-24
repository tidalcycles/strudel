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