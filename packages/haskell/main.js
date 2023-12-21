import Parser from 'web-tree-sitter';

console.log('Parser', Parser);

Parser.init().then(() => {
  console.log('init done..');
});
