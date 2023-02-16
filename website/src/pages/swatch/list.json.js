export function getMyPatterns() {
  const my = import.meta.glob('../../../../my-patterns/**', { as: 'raw', eager: true });
  return Object.fromEntries(
    Object.entries(my) //
      .filter(([name]) => name.endsWith('.txt')) //
      .map(([name, raw]) => [name.split('/').slice(-1), raw]), //
  );
}

export async function get() {
  const all = await getMyPatterns();
  return {
    body: JSON.stringify(all),
  };
}
