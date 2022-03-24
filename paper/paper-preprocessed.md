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
title: Strudel
url2cite: all-links
---

# Introduction

That
@https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode_x61_rpdm20
are excellent, I reference their work at least twice per sentence
[@https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode_x61_rpdm20,
p. 3]. Another reference [@https://zenodo.org/record/5788732].

<MiniRepl tune={`"1 2 3"`} />

# Background

General motivations / related work. Reference vortex paper and summarise
its background.

# Introducing TidalStrudel

(do we want to call it TidalStrudel once, and Strudel for short from
then on as with vortex? Or just stick with Strudel? Should we start
calling TidalCycles just Cycles??)

-   Motivating musical example

# Tidal patterns

-   Some comparisons of -Strudel with -Vortex and -Cycles code?
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

# Musical examples

...

# Ongoing work/future aims

-   WASM Sound Backend
-   OSC -\> Supercollider
-   mininotation as the 'regex' of metre

# References
