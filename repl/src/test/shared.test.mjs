import { queryCode } from '../runtime.mjs';
import { describe, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pidxdsxphlhzjnzmifth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
);

describe('renders shared tunes', async () => {
  const { data } = await supabase.from('code');
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
