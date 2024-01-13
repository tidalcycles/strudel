import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Database, Tables } from '../../database.types';
import { getMetadata } from '../metadata_parser';

function PatternLink({ pattern }: { pattern: Tables<'code'> }) {
  const meta = useMemo(() => getMetadata(pattern.code), [pattern]);
  // console.log('meta', meta);
  return (
    <a href={`/?${pattern.hash}`} target="_blank">
      {pattern.id}. {meta.title || pattern.hash} by {meta.by.join(',') || 'Anonymous'}
    </a>
  );
}

export function SharedPatterns() {
  const [publicPatterns, setPublicPatterns] = useState<Tables<'code'>[] | null>([]);
  const [featuredPatterns, setFeaturedPatterns] = useState<Tables<'code'>[] | null>([]);
  const init = useCallback(async () => {
    const supabase = createClient<Database>(
      'https://pidxdsxphlhzjnzmifth.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpZHhkc3hwaGxoempuem1pZnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTYyMzA1NTYsImV4cCI6MTk3MTgwNjU1Nn0.bqlw7802fsWRnqU5BLYtmXk_k-D1VFmbkHMywWc15NM',
    );
    const { data: _publicPatterns } = await supabase
      .from('code')
      .select()
      .eq('public', true)
      .limit(20)
      .order('id', { ascending: false });
    const { data: _featuredPatterns } = await supabase
      .from('code')
      .select()
      .eq('featured', true)
      .limit(20)
      .order('id', { ascending: false });
    setPublicPatterns(_publicPatterns);
    setFeaturedPatterns(_featuredPatterns);
    /* console.log('public', publicPatterns);
    console.log('featured', featuredPatterns); */
  }, []);
  useEffect(() => {
    init();
  }, [useCallback]);
  return (
    <div>
      <h2 className="">Featured</h2>
      <section>
        {featuredPatterns?.map((pattern, i) => (
          <div key={i}>
            <PatternLink pattern={pattern} />
          </div>
        ))}
      </section>
      <h2>Last Creations</h2>
      <section>
        {publicPatterns?.map((pattern, i) => (
          <div key={i}>
            <PatternLink pattern={pattern} />
          </div>
        ))}
      </section>
    </div>
  );
}
