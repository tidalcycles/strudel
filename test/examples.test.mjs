import { queryCode } from './runtime.mjs';
import { describe, it } from 'vitest';
import doc from '../doc.json';

describe('runs examples', () => {
  const { docs } = doc;
  docs.forEach(async (doc) => {
    doc.examples?.forEach((example, i) => {
      it(`example "${doc.name}" example index ${i}`, async ({ expect }) => {
        const haps = await queryCode(example, 4);
        expect(haps).toMatchSnapshot();
      });
    });
  });
});
