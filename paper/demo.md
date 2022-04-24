---
title: 'Strudel: Algorithmic Patterns for the Web'
date: '2022-04-15'
url2cite: all-links
---

# Introduction

This paper introduces Strudel (or sometimes 'StrudelCycles'), an alternative implementation of the Tidal (or 'TidalCycles') live coding system, using the JavaScript programming language. Strudel is an attempt to make live coding more accessible, by creating a system that runs entirely in the browser, while opening Tidal's approach to algorithmic patterns [@algorithmicpattern] up to modern audio/visual web technologies. The Strudel REPL is a live code editor dedicated to manipulating strudel patterns while they play, with builtin visual feedback. While Strudel is written in JavaScript, the API is optimized for simplicity and readability by applying code transformations on the syntax tree level, allowing language operations that would otherwise be impossible. The application supports multiple ways to output sound, including Tone.js, Web Audio nodes, OSC (Open Sound Control) messages, Web Serial and Web MIDI. The project is split into multiple packages, allowing granular reuse in other applications. Apart from TidalCycles, Strudel draws inspiration from prior projects like TidalVortex [@tidalvortex], Gibber [@gibber], Estuary [@estuary] and Feedforward [@feedforward].

# Porting from Haskell

The original Tidal is implemented as a domain specific language (DSL), embedded in the Haskell pure functional programming language, taking advantage of Haskell's terse syntax and advanced, 'strong' type system. Javascript on the other hand, is a multi-paradigm programming language, with a dynamic type system. Because Tidal leans heavily on many of Haskell's more unique features, it was not always clear that it could meaningfully be ported to a multi-paradigm scripting language. However, this already proved to be the case with an earlier port to Python [TidalVortex; @tidalvortex], and we have now successfully implemented Tidal's pure functional representation of patterns in Strudel, including partial application, and functor, applicative and monad structures. Over the past few months since the project started in January 2022, a large part of Tidal's functionality has already been ported, including it's mini-notation for polymetric sequences, and a large part of its library of pattern manipulations. The result is a terse and highly composable system, where just about everything is a pattern, that may be transformed and combined with other patterns in a myriad of ways.

# Representing Patterns

Patterns are the essence of Tidal. Its patterns are abstract entities that represent flows of time as functions, adapting a technique called pure functional reactive programming.
Taking a time span as its input, a Pattern can output a set of events that happen within that time span.
It depends on the structure of the Pattern how the events are located in time.
From now on, this process of generating events from a time span will be called **querying**.
Example:

```js
const pattern = sequence(c3, [e3, g3]);
const events = pattern.query(0, 1);
console.log(events.map(e => e.show()))
```

In this example, we create a pattern using the `sequence` function and **query** it for the time span from `0` to `1`.
Those numbers represent units of time called **cycles**. The length of one cycle  depends on the tempo, which defaults to one cycle per second.
The resulting events are:

```js
[{ value: 'c3', begin: 0, end: 1/2 },
{ value: 'e3', begin: 1/2, end: 3/4 },
{ value: 'g3', begin: 3/4, end: 1 }]
```

Each event has a value, a begin time and an end time, where time is represented as a fraction.
In the above case, the events are placed in sequential order, where c3 takes the first half, and e3 and g3 together take the second half.
This temporal placement is the result of the `sequence` function, which divides its arguments equally over one cycle.
If an argument is an array, the same rule applies to that part of the cycle. In the example, e3 and g3 are divided equally over the second half of the whole cycle.

In the REPL, the user only has to type in the pattern itself, the querying will be handled by the scheduler.
The scheduler will repeatedly query the pattern for events, which then will be used for playback.

# Making Patterns

In practice, the end-user live coder will not deal with constructing patterns directly, but will rather build patterns using Strudel's extensive combinator library to create, combine and transform patterns.

The live coder may use the `sequence` function as already seen above, or more often the mini-notation for even terser notation of rhythmic sequences. Such sequences are often treated only a starting point for manipulation, where they then are undergo pattern transformations such as repetition, symmetry, interference or randomisation, potentially at multiple timescales. Because Strudel patterns are represented as pure functions of time rather than as data structures, very long and complex generative results can be represented and manipulated without having to store the resulting sequences in memory.

# Pattern Example

The following example showcases how patterns can be utilized to create musical complexity from simple parts, using repetition and interference:

```js
"<0 2 [4 6](3,4,1) 3*2>".scale('D minor')
.off(1/4, scaleTranspose(2))
.off(1/2, scaleTranspose(6))
.legato(.5)
.echo(4, 1/8, .5)
.tone((await piano()).chain(out()))
.pianoroll()
```

The pattern starts with a rhythm of numbers in mini notation, which are interpreted inside the scale of D minor.
Without the scale function, the first line can be expressed as:

```js
"<d3 f3 [a3 c3](3, 4, 1) g3*2>"
```

This line could also be expressed without mini notation:

```js
slowcat(d3, f3, [a3, c3].euclid(3, 4, 1), g3.fast(2))
```

Here is a short description of all the functions used:

- slowcat: play elements sequentially, where each lasts one cycle
- brackets: elements inside brackets are divided equally over the time of their parent
- euclid(p, s, o): place p pulses evenly over s steps, with offset o [@godfried]
- fast(n): speed up by n. `g3.fast(2)` will play g3 two times.
- off(n, f): copy each event, offset it by n cycles and apply function f
- legato(n): multiply duration of event with n
- echo(t, n, v): copy each event t times, with n cycles in between each copy, decreasing velocity by v
- tone(instrument): play back each event with the given Tone.js instrument
- pianoroll(): visualize events as midi notes in a pianoroll

# Future Outlook

The project is still young, with many features on the horizon. As general guiding principles, Strudel aims to be

1. accessible
2. as compatible as possible with Tidal
3. modular and extensible

The main accessibility advantage over Tidal is the zero install browser environment.
While OSC output to SuperCollider is possible with Strudel, it requires the user to install SuperCollider with a custom setup script, which is not trivial. Without OSC output, Strudel is able to output sound inside the browser via Tone.js, which is a major limiting factor, both in terms
of available features and runtime performance. For the future, it is planned to integrate alternative sound engines, with possible candidates being like glicol [@glicol] or faust [@faust]. To improve compatibility with Tidal, more Tidal functions are planned to be ported, as well as full compatibility with Tidal's SuperDirt synth. Besides sound output, other ways to render events will be explored, such as graphical, serial or kinetic output.

# Links

The Strudel REPL is available at <https://strudel.tidalcycles.org>, including an interactive tutorial.
The repository is at <github.com/tidalcycles/strudel>, all the code is open source under the GPL-3.0 License.

# Technical requirements

- Space for one laptop + small audio interface (20 cm x 20cm), with mains power.
- Stereo sound system, either placed behind presenter (for direct monitoring) or with additional stereo monitors.
- Audio from audio interface: stereo pair 6,3mm jack outputs (balanced)
- Projector / screen (HDMI.)

# Acknowledgments

Thanks to the Strudel and wider Tidal, live coding, webaudio and free/open source software communities for inspiration and support. Alex McLean's work on this project is supported by a UKRI Future Leaders Fellowship [grant number MR/V025260/1].

# References

[@roberts2016]: https://www.tandfonline.com/doi/abs/10.1080/14794713.2016.1227602?journalCode=rpdm20
[@gibber]: https://quod.lib.umich.edu/i/icmc/bbp2372.2012.011/2/--gibber-live-coding-audio-in-the-browser?page=root;size=150;view=text
[@alternate-timelines]: https://zenodo.org/record/5788732
[@tidal.pegjs]: https://www.semanticscholar.org/paper/Bringing-the-TidalCycles-Mini-Notation-to-the-Roberts/74965efadd572ae3f40d14c633a5c8581c1b9f42
[@tidalvortex]: https://zenodo.org/record/6456380
[@estuary]: https://www.semanticscholar.org/paper/Estuary%3A-Browser-based-Collaborative-Projectional-Ogborn-Beverley/c6b5d34575d6230dfd8751ca4af8e5f6e44d916b
[@tidalcycles]: https://dl.acm.org/doi/10.1145/2633638.2633647
[@hession]: https://www.scopus.com/record/display.uri?eid=2-s2.0-84907386880&origin=inward&txGid=03307e26fba02a27bdc68bda462016f6266316467_Extending_Instruments_with_Live_Algorithms_in_a_Percussion_Code_Duo
[@spiegel]: https://www.academia.edu/664807/Manipulations_of_musical_patterns
[@bel]: https://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.517.7129
[@algorithmicpattern]: https://zenodo.org/record/4299661
[@fabricating]: https://zenodo.org/record/2155745
[@cyclic-patterns]: https://zenodo.org/record/1548969
[@feedforward]: https://zenodo.org/record/6353969
[@godfried]: https://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.72.1340
[@glicol]: https://webaudioconf.com/posts/2021_8/
[@faust]: https://webaudioconf.com/posts/2019_38/
