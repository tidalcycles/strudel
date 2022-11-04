import { queryCode } from '../runtime.mjs';
import { describe, it } from 'vitest';
import data from './dbdump.json';

describe('renders shared tunes', async () => {
  data.forEach(({ id, code, hash }) => {
    const url = `https://strudel.tidalcycles.org/?${hash}`;
    it(`shared tune ${id} ${url}`, async ({ expect }) => {
      if (code.includes('import(')) {
        console.log('skip', url);
        return;
      }
      const haps = await queryCode(code, 1);
      expect(haps).toMatchSnapshot();
    });
  });
});
