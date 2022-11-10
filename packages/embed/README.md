# @strudel.cycles/embed

This package contains a embeddable web component for the Strudel REPL.

## Usage

Either install with `npm i @strudel.cycles/embed` or just use a cdn to import the script:

```html
<script src="https://unpkg.com/@strudel.cycles/embed@latest"></script>
<strudel-repl>
  <!--
note(`[[e5 [b4 c5] d5 [c5 b4]]
[a4 [a4 c5] e5 [d5 c5]]
[b4 [~ c5] d5 e5]
[c5 a4 a4 ~]
[[~ d5] [~ f5] a5 [g5 f5]]
[e5 [~ c5] e5 [d5 c5]]
[b4 [b4 c5] d5 e5]
[c5 a4 a4 ~]],
[[e2 e3]*4]
[[a2 a3]*4]
[[g#2 g#3]*2 [e2 e3]*2]
[a2 a3 a2 a3 a2 a3 b1 c2]
[[d2 d3]*4]
[[c2 c3]*4]
[[b1 b2]*2 [e2 e3]*2]
[[a1 a2]*4]`).slow(16)
      -->
</strudel-repl>
```

Note that the Code is placed inside HTML comments to prevent the browser from treating it as HTML.
