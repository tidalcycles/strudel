export default function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}
