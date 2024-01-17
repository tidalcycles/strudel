import { examplePattern, $featuredPatterns, $publicPatterns } from '../settings.mjs';
import { useStore } from '@nanostores/react';
import { useCallback, useMemo } from 'react';

export const useExamplePatterns = () => {
  const featuredPatterns = useStore($featuredPatterns);
  const publicPatterns = useStore($publicPatterns);
  const collections = useMemo(() => {
    const pats = new Map();
    pats.set('Featured', featuredPatterns);
    pats.set('Last Creations', publicPatterns);
    pats.set(examplePattern.source, examplePattern.getAll());
    return pats;
  }, [featuredPatterns, publicPatterns]);

  const patterns = useMemo(() => {
    const allPatterns = Object.assign({}, ...collections.values());
    return allPatterns;
  }, [collections]);

  //   const examplePatterns = examplePattern.getAll();

  //   const collections = new Map();
  //   collections.set('Featured', featuredPatterns);
  //   collections.set('Last Creations', publicPatterns);
  //   collections.set(examplePattern.source, examplePatterns);
  //   const patterns = {
  //     ...examplePatterns,
  //     ...publicPatterns,
  //     ...examplePatterns,
  //   };

  return { patterns, collections };
};
