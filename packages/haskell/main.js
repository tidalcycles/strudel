import Parser from 'web-tree-sitter';
import toDot from 'jgf-dot';
import { Graphviz } from '@hpcc-js/wasm';

const graphvizLoaded = Graphviz.load();
const parserLoaded = loadParser();
const graphContainer = document.getElementById('graph');

const textarea = document.getElementById('code');
textarea.value = 'd1 $ s "hh(3,8)"';
textarea.addEventListener('input', (e) => renderGraph(e.target.value, graphContainer));
renderGraph(textarea.value, graphContainer);

function walk(node, branch = [0], parent) {
  let nodes = [];
  let edges = [];
  const current = { id: branch.join('-'), label: node.type };
  nodes.push(current);
  parent && edges.push({ source: parent.id, target: current.id });
  if (node.children.length) {
    node.children.forEach((child, j) => {
      const { nodes: childNodes, edges: childEdges } = walk(child, branch.concat([j]), current);
      nodes = nodes.concat(childNodes || []);
      edges = edges.concat(childEdges || []);
    });
  }
  return { nodes, edges };
}

async function renderGraph(code, container) {
  const parser = await parserLoaded;
  const tree = parser.parse(code);
  const { nodes, edges } = walk(tree.rootNode);
  const graphviz = await graphvizLoaded;
  const dot = toDot({
    graph: {
      nodes,
      edges,
    },
  });
  const svg = await graphviz.layout(dot, 'svg', 'dot');
  container.innerHTML = svg;
}

async function loadParser() {
  await Parser.init();
  const parser = new Parser();
  const Lang = await Parser.Language.load('tree-sitter-haskell.wasm');
  parser.setLanguage(Lang);
  return parser;
}
