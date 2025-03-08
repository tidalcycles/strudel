import cx from '@src/cx.mjs';

export function Textbox({ onChange, className, ...inputProps }) {
  return (
    <input
      className={cx('p-1 bg-background rounded-md my-2 border-foreground', className)}
      onChange={(e) => onChange(e.target.value)}
      {...inputProps}
    />
  );
}
