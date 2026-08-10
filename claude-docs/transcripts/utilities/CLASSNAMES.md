# classNames — Implementation History

## Origin

The conditional className builder pattern appeared verbatim across multiple components:

```tsx
[condition && 'class-a', condition2 && 'class-b', ...].filter(Boolean).join(' ')
```

This pattern was used 8+ times in:

- `Tooltip/index.tsx` (2 instances)
- `Skills/index.tsx` (3 instances)
- `Experience/index.tsx` (1 instance)
- `Projects/index.tsx` (3 instances)

Each instance served the same purpose: build a CSS class string by filtering out falsy conditionals and joining the truthy ones with spaces.

## Consolidation

As part of the "Consolidate shared TS code" task, the pattern was extracted into a dedicated utility function `classNames()` in `src/utils/classNames.ts`:

```tsx
export const classNames = (...values: Array<string | false | null | undefined>): string =>
  values.filter(Boolean).join(' ');
```

All 8+ call sites were updated to use this utility, improving readability and reducing boilerplate:

- Before: `[cond && 'class', cond2 && 'class2'].filter(Boolean).join(' ')`
- After: `classNames(cond && 'class', cond2 && 'class2')`

The output class strings remain identical — this is purely a refactor toward DRY principles, with no behavioral changes.

## Testing

A unit test suite (`src/utils/classNames.test.ts`) was added covering:

- All-falsy input → empty string
- Mixed truthy/falsy → space-joined string
- All-truthy → space-joined string

Integration testing is provided by existing test suites for parent components (Tooltip, Skills, Experience, Projects).
