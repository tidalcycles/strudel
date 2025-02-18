// utility for combining class names
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}