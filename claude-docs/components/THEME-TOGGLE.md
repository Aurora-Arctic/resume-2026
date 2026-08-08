# ThemeToggle — Summary

Full implementation history: [claude-docs/transcripts/components/THEME-TOGGLE.md](../transcripts/components/THEME-TOGGLE.md)

- Theme state is a `data-theme="light"` attribute on `<html>` (absent = dark, the default) — not React state.
- `gatsby-ssr.ts`'s `onRenderBody` injects a synchronous inline `<script>` that reads `localStorage`'s `theme` key, falls back to `matchMedia('(prefers-color-scheme: dark)')`, and only keeps listening for OS-level scheme changes when the key is unset.
- The sun/moon icon swap uses BEM modifier classes (`--out`/`--pre-enter`) on the `<svg>` facets, not `data-theme` selectors, with a `transitionend` listener resetting a facet after it exits — needed so the icon always enters/exits the same direction regardless of toggle order.
- The button is wrapped in the generic `Tooltip` component, announcing "Change to light mode"/"Change to dark mode" based on the live theme.
- `404.tsx` has a real client-side `<Link to="/">` specifically so an e2e test can trigger a genuine component unmount, covering the toggle's `transitionend`-listener cleanup path.
- Uses the shared `_buttons.scss` base for its button styling.
