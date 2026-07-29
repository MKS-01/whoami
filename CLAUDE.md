# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

`mks.sh` — a static personal portfolio styled as a terminal session, plus a
small blog. Deployed as a GitHub Page at **mks-01.github.io/whoami**
(repo `MKS-01/whoami`, renamed from `about-me` July 2026). Only the *repo*
URL redirects — `github.com/MKS-01/about-me` 301s, and even that dies if the
old name is ever reclaimed. The old **Pages** URL does not redirect at all:
`mks-01.github.io/about-me/` is a hard 404 (verified July 2026). Any shared
link to the old site address is already broken — update links, never rely on
a redirect. There is no build step, no framework, no dependencies —
open a file and it runs.

```
style.css                 shared by BOTH kinds of page: tokens, terminal
                          grammar ($ prompts, man-page, cmdline), footer,
                          tmux bar
favicon.svg               the alien mark, one file, linked by every page
theme.js                  accent toggle: sets data-theme pre-paint, injects
                          the tmux-bar swatches. Linked by BOTH page kinds
index.html                the scroll-snap deck. Inline <style> holds ONLY
                          deck-specific CSS (.screen + snap, .mac + .app-*,
                          .projects, .hint) + one inline <script>
blog/post.css             shared by every post: .wrap, .post prose rhythm,
                          headings, pre/code, tables, .hero, .eof
blog/_template.html       copy-me skeleton for a new post
blog/<slug>.html          one post per file — content only, no <style>
```

It was a single file until the blog arrived (July 2026). A post is long-form
scrolling text and cannot live in a mandatory-snap deck, so posts became
their own pages — and with a second page, inlining the tokens twice would
guarantee drift. Hence `style.css`. **Still no build step.**

The same logic applied again in the restructure: posts had each grown a
byte-identical ~116-line inline `<style>`, and the favicon data-URI had
*already* drifted (the landing's copy had a highlight path the posts' lacked).
Both were pulled into single sources — `blog/post.css` and `favicon.svg`.
**Rule of thumb: if you're pasting the same block into a second file, it
wants its own file.** There is still no build step and never should be.

CSS layers, narrowest scope last: `style.css` → `blog/post.css` → a page's
inline `<style>`. A new post should need **no `<style>` block at all**.

⚠️ **`scroll-snap-type` belongs to the deck only.** It lives in `index.html`'s
inline `<style>`, never in `style.css` or `blog/post.css` — putting it in a
shared sheet would break long-form scrolling on every post at once.

**Adding a post** (cap ~10, owner's rule): `cp blog/_template.html
blog/<slug>.html`, fill it in, then paste one `<li>` into the `#blog` screen
in `index.html` (the markup comment there has the snippet), bumping the `--i`
of the entries below it. The list is **paged three per `.bpage`**, so
re-balance the pages after inserting and update `.segs`/`.tcount` if a new
page opens. Keep slugs ≤23 chars or they wrap the name column.

Three screens — `home`, `blog`, `projects` — and that cap is the owner's
("landing page not exceed more than 3 scrolls", July 2026). **Two of them
page sideways** rather than growing past the cap: the three project man
pages are one `.card` each on a track inside `#projects`, and the post list
is three-per-page on a track inside `#blog`. One `makeTrack()` factory
drives both — don't fork it. The tmux bar shows the position of each as a
pane suffix (`1:blogs.2`, `2:projects.1`). `mobile-recon` is listed
on the landing but has no card — it links straight to its repo. Screen DOM order, the `.rail` link
order and the `N:name` window numbers must all agree — the observer maps
rail links by index, so a mismatch highlights the wrong tab.

`#projects` is also the one screen that mirrors the layout: mac left, text
right. See the `portfolio-conventions` skill before touching either track —
notably, never name anything `.track` (it collides with the mac's
now-playing line), and scope any `.tbar` lookup to its own screen now that
there are two.

`theme.js` at the root is the accent toggle (phosphor/amber/classic,
phosphor default): it stamps `data-theme` before first paint and injects
the swatches into the tmux bar on every page. Themes are token blocks in
`style.css`; `favicon.svg` hardcodes the **default** theme's two hexes
because it loads outside the cascade.

## Read the skill first

Before ANY visual, copy, layout, or animation change, invoke the
**`portfolio-conventions`** skill (`.claude/skills/portfolio-conventions/`).
It is the source of truth for the design tokens, the terminal conceit, the
scroll-snap deck, the fixed CSS MacBook, the tmux status-bar nav, the mobile
tiers, and — critically — a long list of **already-rejected ideas** with the
owner's own words. Re-proposing a loser wastes everyone's time; the skill
exists so you don't.

## Verifying changes (no dev server)

Render with headless Chrome and READ the screenshot back — don't eyeball the
diff. The skill documents the exact invocation and the gotchas (fragment
URLs render blank; headless clamps width to 500px min; `position: fixed` mac
sits at the bottom of a tall stacked render). For mobile checks, use a test
copy with `body { width: 390px }` and probe layout via an injected script +
`--dump-dom`, because the real viewport can't be forced below 500px.

Note: this headless environment refuses programmatic scrolling (even a plain
`window.scrollTo` reports 0), so scroll-driven behavior and tap navigation
can't be exercised here — verify those on a real device after deploy.

## Mobile is the sharp edge

Most bugs in this project have been mobile-specific, and iOS Safari behaves
differently from Android:

- iOS Safari **rarely collapses its URL bar** under scroll-snap, so iPhones
  sit at ~620–760px viewport height permanently. Height-threshold rules that
  assume the bar collapses will misfire on iOS while looking fine on Android.
- `env(safe-area-inset-*)` only works with `<meta viewport-fit=cover>`.
- Hash-anchor nav fights `scroll-snap-type: mandatory` on iOS — nav is
  JS-driven (see the skill).

Always test the short-viewport and safe-area cases, not just a tall phone.

## Workflow norms

- **Commit directly to `main`** (this repo's pattern) only when the owner
  says so; then `git push` — the live site is GitHub Pages off `main`, so
  nothing reaches the owner's phone until pushed.
- Commit message co-author trailer names **whichever model actually wrote
  the commit**, not a fixed one:
  `Co-Authored-By: Claude <model> <noreply@anthropic.com>`
  e.g. `Claude Opus 4.8`, `Claude Fable 5`. This line used to hardcode
  Fable 5 and went stale the first time another model worked here —
  signing a different model's name is a small lie in the commit log.
- For subjective/creative choices (copy, layout style, colors) present 2–4
  concrete options via AskUserQuestion — this owner consistently prefers
  picking from real options over open-ended prose.
- When a change encodes a hard-won lesson or a rejected direction, record it
  in the `portfolio-conventions` skill so the next session doesn't repeat it.
