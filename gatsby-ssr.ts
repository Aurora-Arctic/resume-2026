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

    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    if (!stored) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (event) {
        if (event.matches) {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
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
  setHtmlAttributes({ lang: 'en' });

  setHeadComponents([
    // Preconnect + a real <link rel="stylesheet">, rather than the SCSS
    // bundle's old `@import url(...)`, so the browser can discover and
    // start the Google Fonts request as soon as <head> is parsed instead of
    // only after it's fetched and parsed the compiled CSS bundle looking
    // for the @import.
    React.createElement('link', {
      key: 'font-preconnect-googleapis',
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    }),
    React.createElement('link', {
      key: 'font-preconnect-gstatic',
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    }),
    React.createElement('link', {
      key: 'font-stylesheet',
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Lexend:wght@200;300;400;500&family=Bitter:wght@300;400;500&display=swap',
    }),
    React.createElement('script', {
      key: 'theme-init',
      dangerouslySetInnerHTML: { __html: themeInitScript },
    }),
  ]);
};
