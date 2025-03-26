# mondo

an experimental parser for an *uzulang*, a custom dsl for patterns that can stand on its own feet. more info:

- [uzulang I](https://garten.salat.dev/uzu/uzulang1.html)
- [uzulang II](https://garten.salat.dev/uzu/uzulang2.html)

```js
import { MondoRunner } from 'uzu'

const runner = MondoRunner({ seq, cat, s, crush, speed, '*': fast });
const pat = runner.run('s [bd hh*2 cp.(.crush 4) <mt ht lt>] . speed .8')
```

the above code will create the following call structure:

```lisp
(speed 
 (s 
  (seq bd 
   (* hh 2) 
   (crush cp 4) 
   (cat mt ht lt)
  )
 ) .8
)
```

you can pass all available functions to *MondoRunner* as an object.

## snippets / thoughts

### variants of add

```plaintext
n[0 1 2].add(<0 -4>.n).scale"C minor"
```

```js
n("0 1 2").add("<0 -4>".n()).scale("C:minor")
```

---

```plaintext
n[0 1 2].add(n<0 -4>).scale"C minor"
```

```js
n("0 1 2").add(n("<0 -4>")).scale("C:minor")
```

---

```plaintext
n[0 1 2].(add<0 -4>).scale"C minor"
```

```js
n("0 1 2".add("<0 -4>")).scale("C:minor")
```

---

```plaintext
n[0 1 2].scale"C minor"
.sometimes (12.note.add)
```

```js
n("0 1 2").scale("C:minor")
.sometimes(add(note("12")))
```

---

```plaintext
note g2*8.dec <sine saw>/2.(range .1 .4)
```

```js
note("g2*8").dec(cat(sine, saw).slow(2).range(.1, .4))
```

---

```plaintext
n <0 1 2 3 4>*4 .scale"C minor" .jux <rev press>
```

```js
n("<0 1 2 3 4>*4").scale("C:minor").jux(cat(rev,press))
```

---

mondo`
sound [bd sd.(every 3 (.fast 4))].jux <rev (.iter 4)>
`
// og "Alternate Timelines for TidalCycles" example:
// jux <(rev) (iter 4)> $ sound [bd (every 3 (fast 4) [sn])]

### things mondo cant do

how to write lists?

```js
arrange(
  [4, "<c a f e>(3,8)"],
  [2, "<g a>(5,8)"]
).note()
```

how to write objects:

```js
samples({ rave: 'rave/AREUREADY.wav' }, 'github:tidalcycles/dirt-samples')
```

how to access array indices?

```js
note("<[c,eb,g]!2 [c,f,ab] [d,f,ab]>").arpWith(haps => haps[2])
```

s hh .struct(binaryN 55532 16)

comments

variables: note g2*8.dec sine

sine.(range 0 4)/2 doesnt work
sine/2.(range 0 4) works

n (irand 8. ribbon 0 2) .scale"C minor" => lags because no whole

### reference

- arp: note <[c,eb,g] [c,f,ab] [d,f,ab]> .arp [0 [0,2] 1 [0,2]]
- bank: s [bd sd [- bd] sd].bank TR909
- beat: s sd .beat [4,12] 16
- binary: s hh .struct (binary 5)
- binaryN: s hh .struct(binaryN 55532 16) => is wrong
- bite: n[0 1 2 3 4 5 6 7].scale"c mixolydian".bite 4 [3 2 1 0]
- bpattack: note [c2 e2 f2 g2].s sawtooth.bpf 500.bpa <.5 .25 .1 .01>/4.bpenv 4

### dot is a bit ambiguous

```plaintext
n[0 1 2].scale"C minor".ad.1
```

decimal vs pipe

### less ambiguity with [] and ""

in js, s("hh cp") implcitily does [hh cp]
in mondo, s[hh cp] always shows the type of bracket used

### todo

- lists: C:minor
- spread: [0 .. 2]
- replicate: !
