import Parser from 'web-tree-sitter';

const base = import.meta.env.BASE_URL;

async function loadParser() {
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

let parserLoaded = loadParser();
export async function parse(code) {
  const parser = await parserLoaded;
  // for some reason, the parser doesn't like new lines..
  return parser.parse(code.replaceAll('\n\n', '~~~~').replaceAll('\n', '').replaceAll('~~~~', '\n'));
}
