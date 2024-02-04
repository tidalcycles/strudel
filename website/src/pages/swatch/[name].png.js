import { createCanvas } from 'canvas';
import { pianoroll } from '@strudel/core';
import { evaluate } from '@strudel/transpiler';
import '../../../../test/runtime.mjs';
import { getMyPatterns } from '../../my_patterns';

export async function GET({ params, request }) {
  const patterns = await getMyPatterns();
  const { name } = params;
  const tune = patterns[name];
  const { pattern } = await evaluate(tune);
  const haps = pattern.queryArc(0, 4);
  const canvas = createCanvas(800, 800);
  const ctx = canvas.getContext('2d');
  pianoroll({ time: 4, haps, ctx, playhead: 1, fold: 1, background: 'transparent', playheadColor: 'transparent' });
  const buffer = canvas.toBuffer('image/png');
  return new Response(buffer);
}
export async function getStaticPaths() {
  const patterns = await getMyPatterns();
  return Object.keys(patterns).map((name) => ({
    params: {
      name,
    },
  }));
}
