# @strudel/repl

The Strudel REPL as a web component.

## Add Script Tag

First place this script tag once in your HTML:

```html
<script src="https://unpkg.com/@strudel/repl@latest"></script>
```

You can also pin the version like this:

```html
<script src="https://unpkg.com/@strudel/repl@1.0.2"></script>
```

This has the advantage that your code will always work, regardless of potential breaking changes in the strudel codebase.
See [releases](https://github.com/tidalcycles/strudel/releases) for the latest versions.

## Use Web Component

When you've added the script tag, you can use the `strudel-editor` web component:

```html
<strudel-editor>
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
</strudel-editor>
```

This will load the Strudel REPL using the code provided within the HTML comments `<!-- -->`.
The HTML comments are needed to make sure the browser won't interpret it as HTML.

Alternatively you can create a REPL from JavaScript like this:

```html
<script src="https://unpkg.com/@strudel/repl@latest"></script>
<div id="strudel"></div>
<script>
  const repl = document.createElement('strudel-editor');
  repl.setAttribute(
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
  document.getElementById('strudel').append(repl);
</script>
```

## Interacting with the REPL

If you get a hold of the `strudel-editor` element, you can interact with the strudel REPL from Javascript:

```html
<script src="https://unpkg.com/@strudel/repl@latest"></script>
<strudel-editor id="repl">
  <!-- ... -->
</strudel-editor>
<script>
const repl = document.getElementById('repl');
console.log(repl.editor);
</script>
```

or

```html
<script src="https://unpkg.com/@strudel/repl@latest"></script>
<div id="strudel"></div>
<script>
  const repl = document.createElement('strudel-editor');
  repl.setAttribute('code', `...`);
  document.getElementById('strudel').append(repl);
  console.log(repl.editor);
</script>
```

The `.editor` property on the `strudel-editor` web component gives you the instance of [StrudelMirror](https://github.com/tidalcycles/strudel/blob/a46bd9b36ea7d31c9f1d3fca484297c7da86893f/packages/codemirror/codemirror.mjs#L124) that runs the REPL.

For example, you could use `setCode` to change the code from the outside, `start` / `stop` to toggle playback or `evaluate` to evaluate the code.
