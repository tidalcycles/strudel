import { $featuredPatterns, $publicPatterns, collectionName } from '../user_pattern_utils.mjs';
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';
import * as tunes from '../repl/tunes.mjs';

export const stockPatterns = Object.fromEntries(
  Object.entries(tunes).map(([key, code], i) => [i, { id: i, code, collection: 'Stock Examples' }]),
);

export const useExamplePatterns = () => {
  const featuredPatterns = useStore($featuredPatterns);
  const publicPatterns = useStore($publicPatterns);
  const collections = useMemo(() => {
    const pats = new Map();
    pats.set(collectionName.featured, featuredPatterns);
    pats.set(collectionName.public, publicPatterns);
    // pats.set(collectionName.stock, stockPatterns);
    return pats;
  }, [featuredPatterns, publicPatterns]);

  const patterns = useMemo(() => {
    return Object.assign({}, ...collections.values());
  }, [collections]);

  return { patterns, collections };
};
