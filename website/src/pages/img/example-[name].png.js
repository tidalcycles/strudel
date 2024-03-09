import { createCanvas } from 'canvas';
import { pianoroll } from '@strudel/draw';
import { evaluate } from '@strudel/transpiler';
import '../../../../test/runtime.mjs';
import * as tunes from '../../repl/tunes.mjs';

export async function GET({ params, request }) {
  const { name } = params;
  const tune = tunes[name];
  const { pattern } = await evaluate(tune);
  const haps = pattern.queryArc(0, 4);
  const canvas = createCanvas(800, 800);
  const ctx = canvas.getContext('2d');
  pianoroll({ time: 4, haps, ctx, playhead: 1, fold: 1, background: 'transparent', playheadColor: 'transparent' });
  const buffer = canvas.toBuffer('image/png');
  return new Response(buffer);
}
export function getStaticPaths() {
  return Object.keys(tunes).map((name) => ({
    params: {
      name,
    },
  }));
}
