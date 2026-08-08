import React, { type ReactElement, useEffect, useRef } from 'react';
import Tooltip from './Tooltip';

const STORAGE_KEY = 'theme'; // keep in sync with gatsby-ssr.ts's STORAGE_KEY

const applyTheme = (theme: 'light' | 'dark'): void => {
  const root = document.documentElement;
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private browsing, disabled storage) — theme
    // still applies for this page view, just won't persist across reloads
  }
};

// The dark (moon) facet starts resting/visible and the light (sun) facet
// starts parked off to the right (--pre-enter), matching this component's
// dark-mode-by-default markup. If the real starting theme turns out to be
// light (OS preference / stored choice), the layout effect below corrects
// this pre-paint so there's no flash of the wrong icon.
const OUT_CLASS = 'theme-toggle__facet--out';
const PRE_ENTER_CLASS = 'theme-toggle__facet--pre-enter';

// When a facet finishes animating out (rotate 0 -> arc, through the top),
// reset it straight back to --pre-enter — instant, since that class carries
// its own zero-duration transition — so it's parked on the right again,
// ready for its next entrance from there rather than retracing back down
// through the top it just exited through.
const handleFacetTransitionEnd = (event: TransitionEvent): void => {
  const facet = event.target;
  if (
    event.propertyName === 'transform' &&
    facet instanceof SVGElement &&
    facet.classList.contains(OUT_CLASS)
  ) {
    facet.classList.remove(OUT_CLASS);
    facet.classList.add(PRE_ENTER_CLASS);
  }
};

const ThemeToggle = (): ReactElement => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const darkFacetRef = useRef<SVGSVGElement>(null);
  const lightFacetRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const darkFacet = darkFacetRef.current;
    const lightFacet = lightFacetRef.current;
    darkFacet?.addEventListener('transitionend', handleFacetTransitionEnd);
    lightFacet?.addEventListener('transitionend', handleFacetTransitionEnd);
    return () => {
      darkFacet?.removeEventListener('transitionend', handleFacetTransitionEnd);
      lightFacet?.removeEventListener('transitionend', handleFacetTransitionEnd);
    };
  }, []);

  useEffect(() => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    buttonRef.current?.setAttribute('aria-pressed', String(isLight));
    if (isLight) {
      lightFacetRef.current?.classList.remove(PRE_ENTER_CLASS);
      darkFacetRef.current?.classList.add(PRE_ENTER_CLASS);
    }
  }, []);

  const handleToggle = (): void => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const outgoingFacet = isLight ? lightFacetRef.current : darkFacetRef.current;
    const enteringFacet = isLight ? darkFacetRef.current : lightFacetRef.current;
    // Don't assume either facet is in its "normal" resting class state —
    // a click before the previous transition/transitionend finished can
    // leave a facet holding the other modifier (e.g. still --out from an
    // exit that got interrupted), so clear both explicitly rather than
    // toggling just the one each side is expected to have. Otherwise the
    // entering facet can get stuck never losing --out, staying parked out
    // of view instead of coming back to rest.
    outgoingFacet?.classList.remove(PRE_ENTER_CLASS);
    outgoingFacet?.classList.add(OUT_CLASS);
    enteringFacet?.classList.remove(OUT_CLASS, PRE_ENTER_CLASS);
    applyTheme(isLight ? 'dark' : 'light');
    buttonRef.current?.setAttribute('aria-pressed', String(!isLight));
  };

  return (
    <Tooltip
      id="theme-toggle-tooltip"
      className="theme-toggle-tooltip"
      content={
        <>
          <span className="theme-toggle-tooltip__label theme-toggle-tooltip__label--to-light">
            Change to light mode
          </span>
          <span className="theme-toggle-tooltip__label theme-toggle-tooltip__label--to-dark">
            Change to dark mode
          </span>
        </>
      }
    >
      <button
        ref={buttonRef}
        type="button"
        className="theme-toggle"
        aria-label="Toggle light and dark mode for the paper"
        aria-pressed={false}
        onClick={handleToggle}
      >
        <span className="theme-toggle__facets">
          <svg
            ref={darkFacetRef}
            className="theme-toggle__facet theme-toggle__facet--dark"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <mask id="theme-toggle-moon-mask">
              <rect width="24" height="24" fill="white" />
              <polygon
                points="17,0.5 22.86,3.32 24.31,9.67 20.25,14.76 13.75,14.76 9.69,9.67 11.14,3.32"
                fill="black"
              />
            </mask>
            <polygon
              points="12,4 18.25,7.01 19.8,13.78 15.47,19.21 8.53,19.21 4.2,13.78 5.75,7.01"
              fill="currentColor"
              mask="url(#theme-toggle-moon-mask)"
            />
          </svg>
          <svg
            ref={lightFacetRef}
            className="theme-toggle__facet theme-toggle__facet--light theme-toggle__facet--pre-enter"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <polygon
              points="12,8 15.13,9.51 15.9,12.89 13.74,15.6 10.26,15.6 8.1,12.89 8.87,9.51"
              fill="currentColor"
            />
            <polygon points="12,0.03 13.17,4.53 12,6.6 10.83,4.53" fill="currentColor" />
            <polygon points="20.46,3.54 18.11,7.55 15.82,8.18 16.45,5.89" fill="currentColor" />
            <polygon points="23.97,12 19.47,13.17 17.4,12 19.47,10.83" fill="currentColor" />
            <polygon points="20.46,20.46 16.45,18.11 15.82,15.82 18.11,16.45" fill="currentColor" />
            <polygon points="12,23.97 10.83,19.47 12,17.4 13.17,19.47" fill="currentColor" />
            <polygon points="3.54,20.46 5.89,16.45 8.18,15.82 7.55,18.11" fill="currentColor" />
            <polygon points="0.03,12 4.53,10.83 6.6,12 4.53,13.17" fill="currentColor" />
            <polygon points="3.54,3.54 7.55,5.89 8.18,8.18 5.89,7.55" fill="currentColor" />
          </svg>
        </span>
      </button>
    </Tooltip>
  );
};

export default ThemeToggle;
