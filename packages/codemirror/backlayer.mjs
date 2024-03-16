// import { SelectionRange } from '@codemirror/state';
import { RectangleMarker } from '@codemirror/view';
import { layer } from '@codemirror/view';

// currently stuck with: https://discuss.codemirror.net/t/line-background-layer/7666

export const backlayer = layer({
  update: (update) => {
    return update.docChanged;
  },
  markers: (view) => {
    const offsetTop = 14; // how to know this number ? .view.documentTop is scroll relative..
    const offsetLeft = 4; // how to know this number ?

    return view.viewportLineBlocks.map((block) => {
      const { left } = view.coordsAtPos(block.to);
      return new RectangleMarker('cm-backlayer', offsetLeft, block.top + offsetTop, left, block.height);
    });
  },
});

/* const len = view.state.doc.length;
const markers = RectangleMarker.forRange(
  view,
  'cm-backlayer',
  SelectionRange.fromJSON({
    from: 0,
    to: len,
    anchor: 0,
    head: len,
    empty: true,
    assoc: -1,
    bidiLevel: null,
  }),
);
console.log('markser', markers);
return markers;
 */
