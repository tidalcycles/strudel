import jsdocJson from '../../doc.json';
const visibleFunctions = jsdocJson.docs
  .filter(({ name, description }) => name && !name.startsWith('_') && !!description)
  .sort((a, b) => a.meta.filename.localeCompare(b.meta.filename) + a.name.localeCompare(b.name));

export function Reference() {
  return (
    <div className="flex h-full w-full pt-2">
      <div className="w-64 flex-none h-full overflow-y-auto overflow-x-hidden pr-4">
        {visibleFunctions.map((entry, i) => (
          <a key={i} className="cursor-pointer block hover:bg-linegray py-1 px-4" href={`#doc-${i}`}>
            {entry.name} {/* <span className="text-gray-600">{entry.meta.filename}</span> */}
          </a>
        ))}
      </div>
      <div className="break-normal w-full h-full overflow-auto pl-4 flex relative">
        <div className="prose prose-invert">
          <h2>API Reference</h2>
          <p>
            This is the long list functions you can use! Remember that you don't need to remember all of those and that
            you can already make music with a small set of functions!
          </p>
          {visibleFunctions.map((entry, i) => (
            <section key={i}>
              <h3 id={`doc-${i}`}>{entry.name}</h3>
              {/* <small>{entry.meta.filename}</small> */}

              <p dangerouslySetInnerHTML={{ __html: entry.description }}></p>
              {entry.examples?.map((example, j) => (
                <pre key={j}>{example}</pre>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
