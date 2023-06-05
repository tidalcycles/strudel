export function getMetadata(raw_code) {
  // https://stackoverflow.com/a/15123777
  const comment_regexp = /\/\*([\s\S]*?)\*\/|([^\\:]|^)\/\/(.*)$/gm;

  const tag_regexp = /@([a-z]*):? (.*)/gm
  const tags = {};

  for (const match of raw_code.matchAll(comment_regexp)) {
    const comment = match[1] ? match[1] : '' + match[3] ? match[3] : '';
    for (const tag_match of comment.trim().matchAll(tag_regexp)) {
      tags[tag_match[1]] = tag_match[2].trim()
    }
  }

  return tags;
}

export function getMyPatterns() {
  const my = import.meta.glob('../../../../my-patterns/**', { as: 'raw', eager: true });
  return Object.fromEntries(
    Object.entries(my)
      .filter(([name]) => name.endsWith('.txt'))
      .map(([name, raw]) => [ getMetadata(raw)['title'] || name.split('/').slice(-1), raw ]),
  );
}

export async function get() {
  const all = await getMyPatterns();
  return {
    body: JSON.stringify(all),
  };
}
