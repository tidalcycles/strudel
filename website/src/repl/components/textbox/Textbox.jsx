import cx from '@src/cx.mjs';

export function Textbox({ onChange, className, ...inputProps }) {
  return (
    <input
      className={cx(
        'p-2 bg-background rounded-md  border-foreground text-foreground placeholder-foreground',
        className,
      )}
      onChange={(e) => onChange(e.target.value)}
      {...inputProps}
    />
  );
}
