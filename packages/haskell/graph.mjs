import { Graphviz } from '@hpcc-js/wasm';
import toDot from 'jgf-dot';

const graphvizLoaded = Graphviz.load();

function walk(node, branch = [0], parent) {
  let nodes = [];
  let edges = [];
  const color = 'white';
  const current = {
    id: branch.join('-'),
    color,
    fontcolor: color,
    label: node.type.replace('\\', 'lambda'), // backslash kills graphviz..
  };
  nodes.push(current);
  parent && edges.push({ source: parent.id, target: current.id, color });
  if (node.children.length) {
    node.children.forEach((child, j) => {
      const { nodes: childNodes, edges: childEdges } = walk(child, branch.concat([j]), current);
      nodes = nodes.concat(childNodes || []);
      edges = edges.concat(childEdges || []);
    });
  }
  return { nodes, edges };
}

export async function renderGraph(tree, container) {
  const { nodes, edges } = walk(tree.rootNode);
  const graphviz = await graphvizLoaded;
  let dot = toDot({
    graph: {
      nodes,
      edges,
    },
  });
  dot = dot.split('\n');
  dot.splice(1, 0, 'bgcolor="transparent"');
  dot.splice(1, 0, 'color="white"');
  dot = dot.join('\n');
  const svg = await graphviz.layout(dot, 'svg', 'dot', {});
  container.innerHTML = svg;
}
