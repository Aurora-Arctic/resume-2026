// Builds a space-separated class string from mixed truthy/falsy values, filtering out
// falsy entries. Useful for composing conditional BEM modifiers and dynamic classes.
export const classNames = (...values: Array<string | false | null | undefined>): string =>
  values.filter(Boolean).join(' ');
