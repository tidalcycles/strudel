const ALLOW_MANY = ['by', 'url', 'genre', 'license'];

export function getMetadata(raw_code) {
  const comment_regexp = /\/\*([\s\S]*?)\*\/|\/\/(.*)$/gm;
  const tags = {};

  for (const match of raw_code.matchAll(comment_regexp)) {
    const tag_matches = (match[1] || match[2] || '').trim().split('@').slice(1);
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
