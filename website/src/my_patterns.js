import { getMetadata } from './metadata_parser';

export function getMyPatterns() {
  const my = import.meta.glob('../../my-patterns/**', { as: 'raw', eager: true });
  return Object.fromEntries(
    Object.entries(my)
      .filter(([name]) => name.endsWith('.txt'))
      .map(([name, raw]) => [getMetadata(raw)['title'] || name.split('/').slice(-1), raw]),
  );
}
