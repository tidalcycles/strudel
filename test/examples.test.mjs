import { queryCode } from './runtime.mjs';
import { describe, it } from 'vitest';
import doc from '../doc.json';

const skippedExamples = [
  'absoluteOrientationGamma',
  'absoluteOrientationBeta',
  'absoluteOrientationAlpha',
  'orientationGamma',
  'orientationBeta',
  'orientationAlpha',
  'rotationGamma',
  'rotationBeta',
  'rotationAlpha',
  'gravityZ',
  'gravityY',
  'gravityX',
  'accelerationZ',
  'accelerationY',
  'accelerationX',
  'defaultmidimap',
  'midimaps',
];

describe('runs examples', () => {
  const { docs } = doc;
  docs.forEach(async (doc) => {
    if (skippedExamples.includes(doc.name)) {
      return;
    }
    doc.examples?.forEach((example, i) => {
      it(`example "${doc.name}" example index ${i}`, async ({ expect }) => {
        const haps = await queryCode(example, 4);
        expect(haps).toMatchSnapshot();
      });
    });
  });
});
