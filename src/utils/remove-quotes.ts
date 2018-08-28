export function removeQuotes(value: string) {
  if (value.length > 1 && (value[0] === "'" || value[0] === '"')) {
    return value.substr(1, value.length - 2);
  }

  return value;
}
