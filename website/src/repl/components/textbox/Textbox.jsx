import { cn } from 'tailwind_utils.mjs';
// type TextboxProps = {
//     onChange: (val: string | number) => void;
//     ...inputProps
// }
export function Textbox(props) {
  const {onChange, className, ...inputProps} = props
  return (
    <input
      className={cn('p-1 bg-background rounded-md my-2 border-foreground', props.className)}
      onChange={(e) => props.onChange(e.target.value)} 
      {...inputProps}
    />
  );
}
