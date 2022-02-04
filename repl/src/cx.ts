export default function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}
