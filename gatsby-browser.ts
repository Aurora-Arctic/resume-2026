// Self-hosted fonts (see gatsby-ssr.ts and src/scss/_typography.scss for the
// rest of the font story) — only the weights actually used in the CSS are
// imported: Lexend 200 (body default) + 400 (Skills), Syne 400 (all
// headings). gatsby-browser.ts is the standard place for global CSS imports
// in Gatsby, so this bundles into the client CSS the same way _typography.scss
// already does, without an external request to fonts.googleapis.com.
import '@fontsource/lexend/200.css';
import '@fontsource/lexend/400.css';
import '@fontsource/syne/400.css';
