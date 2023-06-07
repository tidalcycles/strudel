const ALLOW_MANY = ['by', 'url', 'genre', 'license'];

export function getMetadata(raw_code) {
  const comment_regexp = /\/\*([\s\S]*?)\*\/|\/\/(.*)$/gm;
  const comments = [...raw_code.matchAll(comment_regexp)].map((c) => (c[1] || c[2] || '').trim());
  const tags = {};

  const [prefix, title] = (comments[0] || '').split('"');
  if (prefix.trim() === '' && title !== undefined) {
    tags['title'] = title;
  }

  for (const comment of comments) {
    const tag_matches = comment.split('@').slice(1);
    for (const tag_match of tag_matches) {
      let [tag, tag_value] = tag_match.split(/ (.*)/s);
      tag = tag.trim();
      tag_value = (tag_value || '').replaceAll(/ +/g, ' ').trim();

      if (ALLOW_MANY.includes(tag)) {
        const tag_list = tag_value
          .split(/[,\n]/)
          .map((t) => t.trim())
          .filter((t) => t !== '');
        tags[tag] = tag in tags ? tags[tag].concat(tag_list) : tag_list;
      } else {
        tag_value = tag_value.replaceAll(/\s+/g, ' ');
        tags[tag] = tag in tags ? tags[tag] + ' ' + tag_value : tag_value;
      }
    }
  }

  return tags;
}
