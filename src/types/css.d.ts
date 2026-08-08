// Side-effect-only CSS imports (e.g. `@fontsource/*` weight files in
// gatsby-browser.ts) — no exported shape needed, unlike scss.d.ts's CSS
// modules classnames object, since nothing ever imports a binding from these.
declare module '*.css';
