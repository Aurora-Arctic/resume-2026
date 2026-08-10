# GithubIcon — Summary

Full implementation history: [claude-docs/transcripts/components/GITHUB-ICON.md](../transcripts/components/GITHUB-ICON.md)

- A minimal presentational component rendering the FontAwesome GitHub SVG (hand-transcribed, `fill="currentColor"`, following the convention established by `PrintOptions`'s `PrintIcon` and `ThemeToggle`'s icon).
- Takes a required `className: string` prop, applied to the `<svg>` element itself — allows callers to control sizing, color overrides, and BEM naming (e.g. `resume-projects__github-icon`, `resume-header__link-icon`).
- No internal styling (`index.scss`) — styling lives entirely at the call site (e.g. `Projects/index.scss` defines `.resume-projects__github-icon`, `Header/index.scss` defines `.resume-header__link-icon`), keeping icon markup decoupled from visual presentation.
- Extracted from duplicated inline `<svg>` definitions in Header and Projects (identical path data, differing only in wrapper `className`). See the consolidation commit for why this duplication occurred.
