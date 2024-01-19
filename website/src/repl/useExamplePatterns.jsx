import { $featuredPatterns, $publicPatterns } from '../user_pattern_utils.mjs';
import { useStore } from '@nanostores/react';
import { useMemo } from 'react';
import * as tunes from '../repl/tunes.mjs';

export const useExamplePatterns = () => {
  const featuredPatterns = useStore($featuredPatterns);
  const publicPatterns = useStore($publicPatterns);
  const collections = useMemo(() => {
    const stockPatterns = Object.fromEntries(Object.entries(tunes).map(([key, code], i) => [i, { id: i, code }]));
    const pats = new Map();
    pats.set('Featured', featuredPatterns);
    pats.set('Last Creations', publicPatterns);
    pats.set('Stock Examples', stockPatterns);
    return pats;
  }, [featuredPatterns, publicPatterns]);

  const patterns = useMemo(() => {
    return Object.assign({}, ...collections.values());
  }, [collections]);

  return { patterns, collections };
};
