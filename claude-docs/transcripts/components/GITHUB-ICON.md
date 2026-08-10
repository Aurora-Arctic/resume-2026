# GithubIcon — Implementation History

## Origin

The GitHub SVG icon was duplicated identically in two places:

1. Header component (`src/components/Header/index.tsx`) — used in the `&__links` list when rendering GitHub profile links
2. Projects component (`src/components/Projects/index.tsx`) — used when rendering a GitHub repository link for a project

Both copies transcribed the same FontAwesome GitHub SVG path data, differing only in the wrapper `className` attribute applied to the `<svg>` element.

## Consolidation

As part of the "Consolidate shared TS code" task, the duplicated SVG definition was extracted into a reusable `GithubIcon` component (`src/components/GithubIcon/index.tsx`) that:

- Renders the identical FontAwesome GitHub SVG
- Takes a required `className: string` prop for styling flexibility
- Contains no internal styling (`index.scss`) — all styling is caller-controlled

This extraction eliminated the duplication while maintaining the existing visual output and styling at each call site:

- Header applies `resume-header__link-icon` (inherited from the unified icon component pattern)
- Projects applies `resume-projects__github-icon` (defined in Projects/index.scss)

## Related Changes

At the same time, Header's `LinkedinIcon` and `LinkIcon` components were updated to also accept a `className` prop, moving their hardcoded `resume-header__link-icon` class to the call site. This unified all three icon components (LinkedIn, GitHub, Link) under a single `(props: { className: string }) => ReactElement` signature, improving consistency and maintainability.
