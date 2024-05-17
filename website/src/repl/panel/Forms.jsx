import cx from '@src/cx.mjs';

export function ButtonGroup({ value, onChange, items }) {
  return (
    <div className="flex flex-wrap max-w-lg">
      {Object.entries(items).map(([key, label], i, arr) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cx(
            'px-2 border-b h-8 whitespace-nowrap',
            value === key ? 'border-foreground' : 'border-transparent',
          )}
        >
          {label.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
