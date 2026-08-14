export function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
