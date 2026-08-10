# Resume — Implementation Record

This document is a transcript of the work done around `src/components/Resume` — the wrapper that assembles the resume's six section components.

## Why it exists

The site previously rendered only placeholder heading/copy directly in `src/pages/index.tsx`. Scaffolding the actual resume sections (Header, Summary, Skills, Experience, Projects, Education — content still to be filled in per-section in later tasks) needed one place to assemble them in order and own the page-level container, rather than having `index.tsx` import and arrange six components directly. `Resume` is that place.

Section order and the section set follow current (2026) technical-resume industry advice, cross-checked against the user-supplied [bridgeviewit.com guide](https://www.bridgeviewit.com/blog/technical-resume-writing-tips/) plus web search on ATS and backend/DevOps-flavored resume conventions: Header/contact → Summary → Skills (grouped by category) → Experience (reverse-chronological) → Projects (placed after Experience — appropriate for a candidate with a solid work history, rather than leading with projects to compensate for a thin one) → Education.

## Data model decision

Content is driven by one central typed data file, `src/data/resume.ts`, rather than each section component hardcoding its own placeholder JSX or importing its own data slice directly. `Resume` takes the whole `ResumeData` object as a prop and hands each section its own slice — keeps the section components pure/presentational and testable in isolation, and later "fill out this section" tasks become data edits rather than component-code edits.

## Layout-flexibility decision

Explicit requirement: keep the print layout a single simple column (standard ATS advice — no tables/text-boxes/multi-column for the parseable form), but leave room for a richer multi-column/sidebar layout on the web view later. `Resume/index.scss` is deliberately minimal right now — `display: flex; flex-direction: column` — so a later task can turn it into a `grid` (e.g. a sidebar for Header/Skills/Education, main column for Summary/Experience/Projects) at a wider breakpoint without reshuffling which components render where. This also keeps print single-column for free: there's no grid/columns in the base styles to override inside `@media print`.

## Reaffirmed: print is always single-column, web is not (2026-08-09)

Restated as a standing design rule rather than a one-time requirement: print output must always display sections top to bottom in a single column — no exceptions, regardless of what the web layout does. The web layout is explicitly allowed to use multiple columns. Today this holds "for free" because `Resume/index.scss` has no grid/columns to override. That will stop being automatic once the future sidebar/multi-column web layout (see above) is built — at that point the web grid must be paired with an explicit `@media print` rule that collapses it back to a single column, rather than assuming the base styles still print correctly unmodified. Noted in `index.scss` as a comment so this isn't lost when that work happens.

## Current state

- `index.tsx`: takes `data: ResumeData`, renders `<Header>`, `<Summary>`, `<Skills>`, `<Experience>`, `<Projects>`, `<Education>` in that order inside a `<div className="resume">`.
- `index.scss`: single-column flex stack, with a comment explaining the future-grid intent.
- `index.test.tsx`: renders with full sample data, asserts every section's heading is present.
- Rendered from `src/pages/index.tsx` as `<Resume data={resumeData} />` inside `Layout`, replacing the old placeholder `<h1>Resume 2026</h1>`/`<p>` copy.

## The future grid landed: Header/Summary two-column layout (2026-08-09)

The sidebar-style web layout anticipated in the "Layout-flexibility decision" section above was built: `Header` becomes a narrow 1/3-width column on the right, `Summary` a wider 2/3-width column on the left, at a new `$breakpoint-desktop` (`src/scss/_variables.scss`, 1024px). Below that breakpoint both stay full-width, stacked in DOM order exactly as before.

Explicit requirement from the user: the visual position of `Header` and `Summary` swaps (Header right, Summary left) but the DOM/content order must NOT change — Header still renders before Summary. This ruled out reordering the JSX in `index.tsx`. Considered `order` (flexbox/grid) vs. explicit `grid-column`/`grid-row` placement — settled on explicit grid placement, not because it differs meaningfully from `order` for accessibility (neither changes DOM/accessibility-tree order; both are purely painting-order changes), but because avoiding `order` sidesteps a known class of browser/AT bugs where focus order gets (incorrectly) derived from visual `order` in flex layouts. `Summary` has no focusable elements, so this was ultimately not a live risk here — noted for the record rather than treated as the deciding factor.

`.resume` stays `display: flex; flex-direction: column` as the mobile-first base. At `$breakpoint-desktop` it switches to `display: grid; grid-template-columns: 2fr 1fr` with a `column-gap`; `.resume-summary` is placed at `grid-column: 1`, `.resume-header` at `grid-column: 2` (both `grid-row: 1`), and `.resume-skills`/`.resume-experience`/`.resume-projects`/`.resume-education` all get `grid-column: 1 / -1` to stay full-width below the two-column row. This is the first width-based (`min-width`) media query in the whole project — every other `@media` rule anywhere in `src/` was `print` or `prefers-reduced-motion` before this.

**Breakpoint value came from measuring the actual container, not a guess.** `.paper-card` (`Layout/index.scss`) caps at `width: min(100%, 960px)` with `4rem` padding, itself inside `.paper-chrome`'s `4rem 2rem` padding. At a narrower candidate like 768px, the card's available content width is only ~576px, which would leave the 1fr (1/3) header column at ~180px — too tight for a right-aligned name/title/contact block even with a shrunk `h1`. 1024px puts the card at its full 960px cap (~832px content width after padding), giving the header column ~267px, which is workable. Chosen as a reasoned starting point rather than a guaranteed-forever value.

**Print was never automatically safe once a real grid landed.** The "for free" single-column print behavior described above only held because there was no grid to override. `index.scss` now has an explicit `@media print { .resume { display: flex; flex-direction: column; } }` block. Resetting `grid-column`/`grid-row` back to `auto` on the six child section classes inside that block turned out to be unnecessary and was left out — those properties have no effect once the parent (`.resume`) stops being a grid in print.

**Also fixed as a prerequisite: the site had no `<meta name="viewport">` tag at all** (checked `gatsby-ssr.ts`'s `onRenderBody` and confirmed no `html.tsx` exists to set one elsewhere). Without it, mobile browsers report a virtual ~980px layout viewport to CSS regardless of physical screen size, so the new `min-width: $breakpoint-desktop` query — and any future one — would have matched on essentially all phones, silently breaking "full width on mobile." Added `<meta name="viewport" content="width=device-width, initial-scale=1" />` to `onRenderBody`'s `setHeadComponents` alongside the existing theme-init script.

See [HEADER.md](HEADER.md) for the `Header`-internal changes (contact-list split, right-align, `h1` sizing) that shipped alongside this.

## Column proportions and gap tuned after landing (2026-08-09)

Follow-up adjustments to the two-column layout above, requested and made directly against the already-landed grid. Claude first doubled `column-gap` from `2rem` to `4rem` ("100% more space" between the header/summary columns) and added a desktop-only `margin-top: 3rem` to `.resume-summary` to line its top edge up against the taller (now multi-line) header block. The user then made further manual edits on top of that: reverted `.resume-summary`'s `margin-top` back to `0`, and changed `.resume`'s desktop `grid-template-columns` from `2fr 1fr` to `5fr 3fr` — a narrower ratio gap between the two columns than the original 2:1 split. The `4rem` `column-gap` itself was left as-is. See [HEADER.md](HEADER.md) for the accompanying `Header`-internal changes from the same round (title line-split, contact-list reorder/re-merge).

## Skills moved later in the section order (2026-08-09)

`Skills` moved from 3rd position (right after `Summary`) to 5th (after `Projects`, before `Education`) — new order: `Header`, `Summary`, `Experience`, `Projects`, `Skills`, `Education`. Requested directly by the user, alongside a broader reshaping of the `Skills` section itself (3-column grid, per-item lists, diamond bullets — see [SKILLS.md](SKILLS.md)) rather than as an isolated ordering change.

No `Resume/index.scss` changes were needed to make the reorder take visual effect: none of `.resume-skills`/`.resume-experience`/`.resume-projects`/`.resume-education` set an explicit `grid-row`, so CSS Grid auto-placement already follows DOM order at the desktop breakpoint, and the mobile-first flex stack always follows DOM order — reordering the JSX in `index.tsx` alone was sufficient in both cases.
