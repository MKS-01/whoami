# Custom skills

Project-scoped skills for building & reviewing this site. Anything placed
here is picked up automatically by Claude Code when working in this repo.
Each skill is its own folder with a `SKILL.md` (name + description
frontmatter, then the instructions).

## Which one to read

| Doing this | Read |
|---|---|
| any visual, layout, copy or animation change | `portfolio-conventions/` |
| adding, editing or removing a blog post | `writing-a-blog-post/`, then the above |
| tuning motion/easing specifically | `.agents/skills/` (see below) |

- **portfolio-conventions/** — the source of truth. Design tokens, the
  terminal conceit, the scroll-snap deck, the fixed CSS MacBook, the tmux
  status-bar nav, the mobile height tiers, the CSS layering rules, and the
  site's content-voice rules.

  Its real value is the **rejected-ideas list**, recorded in the owner's own
  words (the lid animation, the cold-brew glass, the emoji glyphs, the
  divider lines). Re-proposing a loser wastes a round trip. Read it before
  proposing — and when a change encodes a new hard-won lesson, add it here.

- **writing-a-blog-post/** — post-specific: the `less(1)` conceit, the
  markdown subset and front matter, the 85%-technical shape rule, the
  5-minute ceiling, the date rules, and the one-command publish step
  (write `blogs/<slug>.md`, run `bun run check` to refresh
  the landing list). **There are no per-post HTML files** — `blogs/index.html`
  renders them all. Assumes `portfolio-conventions` for the
  underlying design system, so read this one second, not instead of it.

## Installed skills

`.agents/skills/` holds Emil Kowalski's design-engineering set
(`emil-design-eng`, `animation-vocabulary`, `review-animations`), pinned by
`skills-lock.json`. They're vendored and general-purpose — **don't hand-edit
them**; project-specific rules belong in `portfolio-conventions/` instead.
The entrance animation follows their guidance (ease-out, under the 300ms
ceiling, purposeful rather than decorative).
