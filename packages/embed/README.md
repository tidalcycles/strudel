# @strudel.cycles/embed

This package contains a embeddable web component for the Strudel REPL.

## Usage

Either install with `npm i @strudel.cycles/embed` or just use a cdn to import the script:

```html
<script src="https://unpkg.com/@strudel.cycles/embed@latest">
<strudel-repl>
  <!--
  "a4 [a3 c3] a3 c3".color('#F9D649')
.sub("<7 12 5 12>".slow(2))
.off(1/4,x=>x.add(7).color("#FFFFFF #0C3AA1 #C63928"))
.off(1/8,x=>x.add(12).color('#215CB6'))
.slow(2)
.legato(sine.range(0.3, 2).slow(28))
.wave("sawtooth square".fast(2))
.filter('lowpass', cosine.range(500,4000).slow(16))
.out()
.pianoroll({minMidi:20,maxMidi:120,background:'#202124'})
  -->
</strudel-repl>
```

Note that the Code is placed inside HTML comments to prevent the browser from treating it as HTML.
