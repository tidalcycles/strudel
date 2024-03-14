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
.color('cyan')
.claviature({
  range: ['C1', 'C6'], // rendered note range
  palette: ['cyan', 'magenta'],
  stroke: 'black',
  scaleX: 1, scaleY: 1,
  upperHeight: 80, 
  lowerHeight: 50
})
```
