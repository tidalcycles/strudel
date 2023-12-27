const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
export let html = (string) => {
  return parser?.parseFromString(string, 'text/html').querySelectorAll('*');
};
let parseChunk = (chunk) => {
  if (Array.isArray(chunk)) return chunk.flat().join('');
  if (chunk === undefined) return '';
  return chunk;
};
export let h = (strings, ...vars) => {
  let string = '';
  for (let i in strings) {
    string += parseChunk(strings[i]);
    string += parseChunk(vars[i]);
  }
  return html(string);
};
