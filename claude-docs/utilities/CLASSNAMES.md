# classNames — Summary

Full implementation history: [claude-docs/transcripts/utilities/CLASSNAMES.md](../transcripts/utilities/CLASSNAMES.md)

- A utility function for building conditional CSS class strings.
- **Signature:** `classNames(...values: Array<string | false | null | undefined>): string`
- **Behavior:** Filters out falsy values (`false`, `null`, `undefined`), joins the remaining strings with a single space, and returns the result. Returns an empty string if all values are falsy.
- **Common usage pattern:**
  ```tsx
  const className = classNames(
    'base-class',
    condition && 'conditional-class',
    anotherCondition && 'another-class',
  );
  ```
- Extracted from 8+ verbatim occurrences of `[...values...].filter(Boolean).join(' ')` across Tooltip, Skills, Experience, and Projects components. Centralizing this pattern improves readability and reduces boilerplate.
- No unit tests beyond basic filtering/joining coverage — integration testing via parent components' existing test suites validates correct className generation in context.
