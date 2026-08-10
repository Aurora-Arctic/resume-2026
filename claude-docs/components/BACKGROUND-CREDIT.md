# BackgroundCredit — Summary

Full implementation history: [claude-docs/transcripts/components/BACKGROUND-CREDIT.md](../transcripts/components/BACKGROUND-CREDIT.md)

- Stateless component crediting the "Prism" background texture pattern, required by its license.
- Renders a single credit line + link inside the card; hidden in print.
- The texture is split into separate silver-oxide/light variants to support the theme toggle's light/dark modes.
- The attribution link carries `print-hide-url`, opting it out of `_print.scss`'s link-URL print reveal (see [LAYOUT-SETUP.md](../LAYOUT-SETUP.md)) — belt-and-suspenders, since the whole `.background-credit` paragraph is already `display: none` in print regardless.
