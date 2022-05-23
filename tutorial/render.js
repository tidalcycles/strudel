import nunjucks from 'nunjucks';
import jsdoc from '../doc.json' assert { type: 'json' };

// TODO: load tutorial.mdx and append rendered api.mdx to the bottom (to make sure TOC works)
// TODO: split

const env = nunjucks.configure('templates', { autoescape: false });

const docs = jsdoc.docs.reduce((acc, obj) => Object.assign(acc, { [obj.longname]: obj }), {});

function renderAsMDX(name) {
  const item = docs[name];
  if (!item) {
    console.warn('Not found: ' + name);
    return '';
  }
  return `### ${item.longname}

${item.description.replaceAll(/\{\@link ([a-zA-Z]+)?\#?([a-zA-Z]*)\}/g, (_, a, b) => {
  // console.log(_, 'a', a, 'b', b);
  return `<a href="#${a}${b ? `-${b}` : ''}">${a}${b ? `#${b}` : ''}</a>`;
})}

${!!item.params?.length ? '**Parameters**' : ''}
  
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
    ? `**Examples**

<div className="space-y-2">
  ${item.examples?.map((example, k) => `<MiniRepl tune={\`${example}\`} />`).join('\n\n')}
</div>`
    : ''
}`;
}

env.addFilter('jsdoc', renderAsMDX);

const rendered = nunjucks.render('api.mdx', { docs });
console.log(rendered);
