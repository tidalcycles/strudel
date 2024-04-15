# @strudel/embed

This package contains a embeddable web component for the Strudel REPL.

## Usage via Script Tag

Use this code in any HTML file:

```html
<script src="https://unpkg.com/@strudel/embed@latest"></script>
<strudel-repl>
  <!--
setcps(1)
n("<0 1 2 3 4>*8").scale('G4 minor')
.s("gm_lead_6_voice")
.clip(sine.range(.2,.8).slow(8))
.jux(rev)
.room(2)
.sometimes(add(note("12")))
.lpf(perlin.range(200,20000).slow(4))
-->
</strudel-repl>
```

This will load the strudel website in an iframe, using the code provided within the HTML comments `<!-- -->`.
The HTML comments are needed to make sure the browser won't interpret it as HTML.

Alternatively you can create a REPL from JavaScript like this:

```html
<script src="https://unpkg.com/@strudel/embed@1.0.2"></script>
<div id="strudel"></div>
<script>
  let editor = document.createElement('strudel-repl');
  editor.setAttribute(
    'code',
    `setcps(1)
n("<0 1 2 3 4>*8").scale('G4 minor')
.s("gm_lead_6_voice")
.clip(sine.range(.2,.8).slow(8))
.jux(rev)
.room(2)
.sometimes(add(note("12")))
.lpf(perlin.range(200,20000).slow(4))`,
  );
  document.getElementById('strudel').append(editor);
</script>
```

When you're using JSX, you could also use the `code` attribute in your markup:

```html
<script src="https://unpkg.com/@strudel/embed@1.0.2"></script>
<strudel-repl code={`
setcps(1)
n("<0 1 2 3 4>*8").scale('G4 minor')
.s("gm_lead_6_voice")
.clip(sine.range(.2,.8).slow(8))
.jux(rev)
.room(2)
.sometimes(add(note("12")))
.lpf(perlin.range(200,20000).slow(4))
`}></strudel-repl>
```
