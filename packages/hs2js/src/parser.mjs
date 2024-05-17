import Parser from 'web-tree-sitter';

let base = '/';
export function setBase(path) {
  base = path;
}

async function _loadParser() {
  await Parser.init({
    locateFile(scriptName, scriptDirectory) {
      return `${base}${scriptName}`;
    },
  });
  const parser = new Parser();
  const Lang = await Parser.Language.load(`${base}tree-sitter-haskell.wasm`);
  parser.setLanguage(Lang);
  return parser;
}

let parserLoaded;
export function loadParser() {
  if (!parserLoaded) {
    parserLoaded = _loadParser();
  }
  return parserLoaded;
}

export async function parse(code) {
  const parser = await loadParser();
  // for some reason, the parser doesn't like new lines..
  return parser.parse(code.replaceAll('\n\n', '~~~~').replaceAll('\n', '').replaceAll('~~~~', '\n'));
}
