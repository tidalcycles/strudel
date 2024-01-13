import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Tables } from '../../database.types';
import { getMetadata } from '../metadata_parser';
import { loadFeaturedPatterns, loadPublicPatterns } from '../repl/util.mjs';

export function PatternLabel({ pattern }: { pattern: Tables<'code'> }) {
  const meta = useMemo(() => getMetadata(pattern.code), [pattern]);
  return (
    <>
      {pattern.id}. {meta.title || pattern.hash} by {meta.by.join(',') || 'Anonymous'}
    </>
  );
}

export const usePublicPatterns = () => {
  const [publicPatterns, setPublicPatterns] = useState<Tables<'code'>[] | null>([]);
  const [featuredPatterns, setFeaturedPatterns] = useState<Tables<'code'>[] | null>([]);
  const init = useCallback(async () => {
    const { data: _publicPatterns } = await loadPublicPatterns();
    const { data: _featuredPatterns } = await loadFeaturedPatterns();
    setPublicPatterns(_publicPatterns);
    setFeaturedPatterns(_featuredPatterns);
  }, []);
  useEffect(() => {
    init();
  }, [useCallback]);
  return { publicPatterns, featuredPatterns };
};

export function SharedPatterns() {
  const { publicPatterns, featuredPatterns } = usePublicPatterns();
  return (
    <div>
      <h2 className="">Featured</h2>
      <section>
        {featuredPatterns?.map((pattern, i) => (
          <div key={i}>
            <a href={`/?${pattern.hash}`} target="_blank">
              <PatternLabel pattern={pattern} />
            </a>
          </div>
        ))}
      </section>
      <h2>Last Creations</h2>
      <section>
        {publicPatterns?.map((pattern, i) => (
          <div key={i}>
            <a href={`/?${pattern.hash}`} target="_blank">
              <PatternLabel pattern={pattern} />
            </a>
          </div>
        ))}
      </section>
    </div>
  );
}
