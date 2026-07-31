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
a redirect. No framework and no dependencies — the deployed site is plain
static files, and opening one in a browser still runs it.

```
style.css                 shared by BOTH kinds of page: tokens, @font-face,
                          terminal grammar ($ prompts, man-page, cmdline),
                          footer, tmux bar
favicon.svg               the alien mark, one file, linked by every page
fonts/                    Fira Code, latin variable woff2 + its OFL licence
theme.js                  accent toggle: sets data-theme pre-paint, injects
                          the tmux-bar swatches, repaints theme-color, stamps
                          the © year. Linked by BOTH page kinds
index.html                the scroll-snap deck — markup only now
deck.css / deck.js        deck-only CSS and behaviour. Linked by index.html
                          and NOTHING else (.screen + snap, .mac + .app-*,
                          .projects, .hint; the track factory, the observers)
blog/post.html            THE post page — ONE file serves every post.
                          Reads ?p=<slug> and renders it in the browser
blog/render.js            the markdown renderer + the page wiring
blog/post.css             shared by every post: .wrap, .post prose rhythm,
                          headings, pre/code, tables, .hero, .eof
blog/posts/<slug>.md      THE SOURCE OF A POST — front matter + markdown
blog/posts/_template.md   copy-me skeleton for a new post
404.html                  a router, no chrome: maps the old
                          /blog/<slug>.html URLs onto post.html
tools/build-blog.py       writes the #blog list into index.html (stdlib only)
```

It was a single file until the blog arrived (July 2026). A post is long-form
scrolling text and cannot live in a mandatory-snap deck, so posts became
their own pages — and with a second page, inlining the tokens twice would
guarantee drift. Hence `style.css`.

The same logic applied again in the restructure: posts had each grown a
byte-identical ~116-line inline `<style>`, and the favicon data-URI had
*already* drifted (the landing's copy had a highlight path the posts' lacked).
Both were pulled into single sources — `blog/post.css` and `favicon.svg`.
**Rule of thumb: if you're pasting the same block into a second file, it
wants its own file.**

### One template, markdown posts (owner's call, July 2026)

Every `blog/<slug>.html` used to carry ~55 lines of identical chrome, and
each post's title/date/read-time/description was typed a *second* time into
an `<li>` in `index.html`. Now there is **one** post page —
`blog/post.html` — and it renders any post client-side from
`blog/posts/<slug>.md`. There are no per-post HTML files, and adding a post
never adds one.

The owner asked for this directly ("single html template for blog and to
avoid multiple blog html, post format in markdown") after a first pass that
generated the pages at build time. **Don't reintroduce per-post HTML.**

What it costs, all three deliberate and accepted:

- **A post can't be opened over `file://`** — `fetch` is blocked there. The
  page says so and tells you to run `python3 -m http.server`. The landing
  page is unaffected and still opens straight off disk.
- **Share cards are generic.** One shell serves every post, so
  `og:title`/`og:description` describe the blog, not the post — scrapers
  don't run JS. `document.title` is still set per post.
- **No JS, no post.** Acceptable for a page whose whole content is fetched.

Old links still work: posts lived at `/blog/<slug>.html` and those URLs were
shared, so `404.html` catches them and redirects to `post.html?p=<slug>`.
Never delete that file.

**`tools/build-blog.py` survives for one job**: the post list on the landing
page. Nothing in a browser can enumerate a directory over http, so the
slugs, titles, dates and read-times are baked into `index.html` between the
`BUILD:` markers. It also enforces what the browser has no good way to
complain about — the 1000-word ceiling, the 23-char slug, the ~10-post cap.

⚠️ **Read time is computed in two places** — `readTime()` in
`blog/render.js` (for the page) and `word_count()` in `tools/build-blog.py`
(for the list). Same formula, same exclusions. Change one and you must
change the other, or a post advertises one length on the list and another on
the page.

CSS layers, narrowest scope last: `style.css` → `deck.css` (the deck) or
`blog/post.css` (posts) → a page's inline `<style>`. A post needs **no
`<style>` block at all**, and there's nowhere to put one anyway — the .md
has no slot for it. That's deliberate; CSS a post needs goes in `post.css`.

⚠️ **`scroll-snap-type` belongs to the deck only.** It lives at the top of
`deck.css`, which index.html links and no post ever does. Never move it into
`style.css` or `blog/post.css` — either would break long-form scrolling on
every post at once.

**Adding a post** (cap ~10, enforced): `cp blog/posts/_template.md
blog/posts/<slug>.md`, write it, then `python3 tools/build-blog.py` to
refresh the landing list. That is the whole publish step — no new HTML file,
no `<li>` to paste, no `--i` to renumber, no word counting, no `.bpage`
re-balancing. Deleting the `.md` and rebuilding removes the post. See the
`writing-a-blog-post` skill for the format.

`python3 tools/build-blog.py --check` runs in the Pages workflow, so a
forgotten rebuild fails the deploy rather than shipping a list that
disagrees with the posts.

Three screens — `home`, `blog`, `projects` — and that cap is the owner's
("landing page not exceed more than 3 scrolls", July 2026). **Two of them
page sideways** rather than growing past the cap: the three project man
pages are one `.card` each on a track inside `#projects`, and the post list
is three-per-page on a track inside `#blog`. One `makeTrack()` factory in
`deck.js` drives both — don't fork it. The tmux bar shows the position of each as a
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
phosphor default): it stamps `data-theme` before first paint, injects the
swatches into the tmux bar, repaints `<meta name="theme-color">`, and stamps
the © year — on every page, both kinds. Themes are token blocks in
`style.css`. `favicon.svg` hardcodes the **default** theme's two hexes
because it loads outside the cascade and cannot follow the toggle;
`theme-color` is a real element, so it does follow. Don't "fix" that
asymmetry in either direction.

The font is served from `fonts/` — one latin variable woff2, `@font-face` in
`style.css`, preloaded by every page. There is no Google Fonts link anywhere
and no request leaves the origin; keep it that way. The site's `→ ✔ ▲ ▶ ☕`
sit outside every subset Google ever shipped for Fira Code, so they render
from the system monospace — that predates the self-hosting and is not a
regression.

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

⚠️ **A post cannot be verified over `file://`** — `fetch` is blocked there,
so you'll screenshot the "can't load" message and think you broke it. Serve
the repo first:

```bash
python3 -m http.server 8899
# then screenshot http://localhost:8899/blog/post.html?p=<slug>
```

The landing page still renders fine straight off disk.

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
