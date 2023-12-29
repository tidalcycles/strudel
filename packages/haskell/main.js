import Parser from 'web-tree-sitter';

console.log('Parser', Parser);

Parser.init().then(async () => {
  const parser = new Parser();
  const Lang = await Parser.Language.load('tree-sitter-haskell.wasm');
  parser.setLanguage(Lang);
  const tree = parser.parse('d1 $ s "hh*3"');
  console.log(tree.rootNode.toString());
});
