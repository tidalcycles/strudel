# Tidal Features in Strudel

## Basics

- [ ] drawLine
- [ ] setcps
- [ ] naming patterns? block based evaluation?
- [ ] once
- [x] silence
- [x] hush
- [ ] panic

## Concatenation

https://tidalcycles.org/docs/patternlib/tour/concatenation

- [x] cat: is synonym to fastcat in strudel, while [in tidal, cat is slowcat](https://tidalcycles.org/docs/patternlib/tour/concatenation#cat)
- [x] fastcat
- [x] timeCat: why is this camel case?
- [ ] randcat
- [x] append: but is like fastAppend in tidal
- [ ] fastAppend
- [ ] slowAppend
- [ ] wedge
- [ ] brak
- [ ] flatpat

## Accumulation

- [ ] overlay => like stack? "The overlay function is similar to cat" => wrong?
- [ ] `<>` operator (=== overlay)
- [x] stack
- [x] superimpose
- [x] layer
- [ ] steps ?
- [x] iter
- [x] iter' = iterBack

## Alteration

- [ ] range, rangex
- [ ] quantise
- [ ] ply
- [x] stutter = echo
- [ ] stripe, slowstripe
- [ ] palindrome = every(2, rev)
- [ ] trunc
- [ ] linger
- [x] chunk, chunk'
- [ ] shuffle
- [ ] scramble
- [ ] rot
- [ ] step / step'
- [ ] lindenmeyer
- [ ] spread / spreadf / fastspread
- [ ] spreadChoose / spreadr

## conditions

- [x] every
- [ ] every'
- [ ] whenmod
- [ ] sometimes, sometimesBy, someCycles, someCyclesBy
- [ ] choose, chooseby, wchoose, wchooseby
- [x] struct
- [x] mask
- [ ] sew
- [ ] stitch
- [ ] select, selectF
- [ ] pickF
- [ ] squeeze
- [x] euclid, euclidLegato
- [ ] euclidInv, euclidFull
- [ ] ifp

## Time

- [x] fast
- [x] fastGap
- [x] slow
- [ ] hurry
- [ ] compress: is this compressSpan?
- [ ] zoom
- [ ] within
- [x] off
- [ ] rotL / rotR
- [x] rev
- [x] jux
- [ ] juxBy
- [ ] swingBy / swing
- [ ] ghost
- [ ] inside / outside

## Harmony & Melody

- [x] scale
- [ ] scaleList
- [ ] getScale
- [ ] toScale
- [ ] chordList
- [ ] arpeggiate
- [ ] arp

## Transitions

- [ ] anticipate / anticipateIn
- [ ] clutch / clutchIn
- [ ] histpan
- [ ] interpolate / interpolateIn
- [ ] jump / jumpIn / jumpIn' / jumpMod
- [ ] wait / waitT
- [ ] wash / washIn
- [ ] xfade / xfadeIn

## Sampling

- [ ] chop
- [ ] striate / striateBy
- [ ] loopAt
- [x] segment
- [ ] discretise

## Randomness

- [ ] rand / irand
- [ ] perlin / perlinWith / perlin2 / perlin2With

## Composition

- [ ] ur
- [ ] seqP / seqPLoop
