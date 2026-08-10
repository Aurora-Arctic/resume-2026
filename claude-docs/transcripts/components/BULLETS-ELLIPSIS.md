# BulletsEllipsis — Implementation History

## Origin

The print-tier truncation ellipsis span was duplicated identically in two places:

1. Experience component (`src/components/Experience/index.tsx`) — renders a `…` when detailed bullet points are hidden in summary/minimal print tiers
2. Projects component (`src/components/Projects/index.tsx`) — renders a `…` when detailed bullet points are hidden in summary/minimal print tiers

Both copies rendered:

```tsx
<span className="resume-{block}__bullets-ellipsis" aria-hidden="true">
  &hellip;
</span>
```

differing only in the BEM block name in the className.

## Consolidation

As part of the "Consolidate shared TS code" task, the duplicated span was extracted into a reusable `BulletsEllipsis` component (`src/components/BulletsEllipsis/index.tsx`) that:

- Renders the identical `<span aria-hidden="true">&hellip;</span>` markup
- Takes a required `className: string` prop for BEM naming flexibility
- Contains no internal styling (`index.scss`) — all styling lives at the call site (Experience/index.scss and Projects/index.scss)

This extraction eliminated the duplication while maintaining the existing visual output and styling:

- Experience applies `resume-experience__bullets-ellipsis` (defined in Experience/index.scss with `@include ellipsis-ink`)
- Projects applies `resume-projects__bullets-ellipsis` (defined in Projects/index.scss with `@include ellipsis-ink`)

## Print-Tier Context

The ellipsis is hidden on screen and in Full/Application print tiers (via CSS `display: none`), visible only in Summary and Minimal tiers where the bullets `<ul>` is hidden but the component still renders the ellipsis to signal truncated content to the reader.
