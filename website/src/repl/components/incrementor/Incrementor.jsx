import { cn } from 'tailwind_utils.mjs';
import { Textbox } from '../textbox/Textbox';

function IncButton({ children, label, className, ...buttonProps }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'rounded-md border border-transparent p-1 text-center text-sm transition-all   hover:bg-foreground active:bg-lineBackground disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
        className,
      )}
      type="button"
      {...buttonProps}
    >
      {children ?? label}
    </button>
  );
}
export function Incrementor({ onChange, value, min = -Infinity, max = Infinity, className }) {
  value = parseInt(value);
  value = isNaN(value) ? '' : value;
  return (
    <div className={cn('w-fit bg-background relative flex  items-center"> rounded-md', className)}>
      <Textbox
        min={min}
        max={max}
        onChange={(v) => {
          if (v.length && v < min) {
            return;
          }
          onChange(v);
        }}
        type="number"
        placeholder=""
        value={value}
        className="w-32 my-0 border-none rounded-r-none bg-transparent appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="flex gap-1 ">
        <IncButton label={'increment'} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path d="M3.75 7.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" />
          </svg>
        </IncButton>
        <IncButton label={'decrement'} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
          </svg>
        </IncButton>
      </div>
    </div>
  );
}
