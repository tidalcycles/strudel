# @strudel/widgets

adds UI widgets to codemirror

## claviature

`Patter.claviature` renders a [claviature](https://www.npmjs.com/package/claviature).

example usage:

```js
chord("<Em9 A7 D^7@2>").voicing().piano()
  .claviature()
```

All [claviature options](https://www.npmjs.com/package/claviature#options) will work.

Here is an example that uses all available options:

```js
chord("<Em9 A7 D^7@2>").voicing().piano()
.claviature({
  range: ['C1', 'C6'], // rendered note range
  color: 'yellow', // highlighting color
  palette: ['cyan', 'magenta'],
  stroke: 'black',
  scaleX: 1, scaleY: 1,
  upperHeight: 80, 
  lowerHeight: 50
})
```

Note: The `Pattern.claviature` method uses the `colorization` option internally, so don't override that and use the `color` option for changing the highlighting color.
