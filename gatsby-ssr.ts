import React from 'react';
import type { GatsbySSR } from 'gatsby';

const STORAGE_KEY = 'theme'; // keep in sync with src/components/ThemeToggle/index.tsx's STORAGE_KEY

// Runs synchronously in <head>, before <body> is parsed, so the correct
// theme is applied before first paint — avoids a flash of the wrong theme
// on this statically-generated site, where the build has no knowledge of
// any given visitor's system preference or prior choice.
const themeInitScript = `(function () {
  try {
    var stored = window.localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);

    if (!stored) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (event) {
        document.documentElement.setAttribute('data-theme', event.matches ? 'dark' : 'light');
      };
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onChange);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(onChange);
      }
    }
  } catch (e) {
    // localStorage/matchMedia unavailable — falls back to the default (dark) styling
  }
})();`;

export const onRenderBody: GatsbySSR['onRenderBody'] = ({
  setHeadComponents,
  setHtmlAttributes,
}) => {
  // 'dark' is the static default baked into the server-rendered markup —
  // the init script below overwrites it to 'light' before first paint when
  // that's the resolved theme, but the attribute itself is never absent,
  // including with JS disabled or if the script's try/catch falls through.
  // React's HTMLAttributes type has no index signature for arbitrary
  // data-* keys (that allowance is JSX-namespace-only), so the object is
  // typed as a variable — rather than passed inline — to add just this one.
  const htmlAttributes: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHtmlElement>,
    HTMLHtmlElement
  > & { 'data-theme': string } = { lang: 'en', 'data-theme': 'dark' };
  setHtmlAttributes(htmlAttributes);

  setHeadComponents([
    React.createElement('meta', {
      key: 'viewport',
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    }),
    // Fonts are self-hosted via @fontsource (see gatsby-browser.ts) — no
    // Google Fonts <link>s needed here anymore.
    React.createElement('script', {
      key: 'theme-init',
      dangerouslySetInnerHTML: { __html: themeInitScript },
    }),
  ]);
};
