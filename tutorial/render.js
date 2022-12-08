import nunjucks from 'nunjucks';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const jsdoc = JSON.parse(await readFile(`${__dirname}/../doc.json`, 'utf8'));
// import jsdoc from '../doc.json' assert { type: 'json' }; // node 18

const env = nunjucks.configure('.', { autoescape: false });

const docs = jsdoc.docs.reduce((acc, obj) => Object.assign(acc, { [obj.longname]: obj }), {});

function renderAsMDX(name) {
  const item = docs[name];
  if (!item) {
    console.warn('Not found: ' + name);
    return '';
  }
  return `### ${item.longname}

${item.description.replaceAll(/\{@link ([a-zA-Z]+)?#?([a-zA-Z]*)\}/g, (_, a, b) => {
  // console.log(_, 'a', a, 'b', b);
  return `<a href="#${a}${b ? `-${b}` : ''}">${a}${b ? `#${b}` : ''}</a>`;
})}

${
  item.params
    ?.map(
      (param, i) =>
        `- ${param.name} (${param.type?.names?.join('|')}): ${param.description?.replace(/(<([^>]+)>)/gi, '')}`,
    )
    .join('\n') || ''
}

${
  item.examples?.length
    ? `
<div className="space-y-2">
  ${item.examples?.map((example, k) => `<MiniRepl tune={\`${example}\`} />`).join('\n\n')}
</div>`
    : ''
}`;
}

env.addFilter('jsdoc', renderAsMDX);

const rendered = nunjucks.render('tutorial.mdx', { docs });
console.log(rendered);
