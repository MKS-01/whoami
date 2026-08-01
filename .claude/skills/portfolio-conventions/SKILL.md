---
name: portfolio-conventions
description: Design system, content voice, and animation conventions for MKS's mks.sh terminal-style portfolio (index.html). Use before making ANY visual or copy change to this page — new sections, rewording lines, adjusting colors/spacing, or touching the entrance animation.
---

# mks.sh portfolio conventions

Static terminal-styled site: `index.html` is a scroll-snap deck, **one**
page (`blogs/index.html`) renders every long-form post in the browser from
`blogs/*.md` (July 2026 — there are no per-post HTML files, and the
owner asked for it that way), `style.css` is the shared vocabulary. Everything —
header, whoami, project list, now-reading, footer, posts — reads like one
continuous shell session. Every design and copy decision should reinforce
that illusion, not break it.

## Where CSS goes (decided July 2026)

The site was one file until the blog. Posts forced a split, because a post is
long-form scrolling text and a deck screen is a snap stop — opposite layout
models — and duplicating tokens across 11 files would guarantee drift.

Three layers, narrowest scope last:

- **`style.css`** — anything *two different kinds of page* share: `:root`
  tokens, the `@font-face`, reset, base type, `.in` entrance, header/wordmark,
  `.prompt`/`.cmdline`/`.output`, `.reading`, `.man-*`, `footer`, `.rail`
  tmux bar, `.site-foot`, `.cursor`.
- **`deck.css`** — deck-only: `.screen` + snap, `.mac` and every `.app-*`,
  `.projects`, `.hint`, the mac's mobile height tiers. Linked by
  `index.html` and **nothing else**; `deck.js` is its behavioural twin.
- **`blogs/blog.css`** — everything the post page needs and the deck doesn't:
  `.wrap`, `.blog` prose rhythm, headings, `pre`/`code`, tables, `.hero`,
  `.eof`, and the `body:not(.ready)` gate that holds the entrance print
  until the fetched body lands. `blogs/index.html` links it as `blog.css`.
- **A page's inline `<style>`** — index.html keeps only the `<noscript>`
  block, which has to be inline. **Posts have none and cannot have one** —
  the `.md` source has no slot for it. That's deliberate.

**The one rule that breaks everything if violated:** `scroll-snap-type: y
mandatory` stays at the top of `deck.css`. Never move it to `style.css` *or*
`blogs/blog.css` — either would apply to every post and destroy long-form
scrolling. What makes `deck.css` safe is that no post links it; keep it that
way, and keep the comment saying so.

Load order is `style.css` → `deck.css`/`blog.css`, so each layer can override
the one before it at equal specificity without `!important`.

**Why `deck.css`/`deck.js` exist (July 2026):** `index.html` had become 56KB
— 744 lines of CSS and 244 of JS around ~290 lines of markup. Same reasoning
as `blog.css`: the file you open should be the thing you're editing. It's now
19KB of markup.

**Why `blog.css` exists (July 2026):** the first two posts and the template
each carried a byte-identical ~116-line inline block. At the owner's ~10-post
cap that is ~1,100 lines of copy-paste with no shared source — the exact
drift `style.css` was created to prevent. If you find yourself pasting CSS
into a new post, it belongs in `blog.css` instead.

## One asset, one file

`favicon.svg` at the repo root is the single source for the alien mark —
`index.html` links `favicon.svg`, `blogs/index.html` links `../favicon.svg`.

This is not a hypothetical rule. Both used to inline the same data-URI
separately and **had already drifted**: the landing's copy carried a
highlight `<path>` the posts' copy lacked, so the two served visibly
different marks. Don't re-inline it.

Its hexes are hardcoded (`#4F9A60`, `#070807` — the *default* theme's
accent and bg) because a favicon loads
outside the page's cascade and can't see `var(--accent)`. If a token
changes, update the literals in `favicon.svg` too — the comment in that
file says so.

**Only `favicon.svg` is pinned green.** The wordmark alien and the pointer
both follow `var(--accent)`, so they change with the theme (owner, July
2026: "alien on whoami section keep updating as per theme"). The tab icon
can't follow — it loads outside the cascade — so it hardcodes the default
theme's green and stays green in all three. That asymmetry is intentional;
don't "fix" it by pinning the wordmark too.

**If the tab icon looks like the OLD colour, it's cache, not code.**
Browsers cache favicons aggressively and ignore a normal reload. The icon
links carry a `?v=N` query for exactly this reason — bump N whenever
`favicon.svg` changes colour, in `index.html` **and** in `blogs/index.html`.
Two places, not seven.

**The header wordmark alien must stay inline** — it fills from
`var(--accent)`/`var(--bg)`, so it has to live in the page's cascade; an
`<img>` or a cross-document `<use>` can't see those. It had drifted before
(landing had 3 paths, every post had 2 — missing the highlight stroke).
There are now exactly **two** copies — `index.html` and `blogs/index.html` —
because every post is served by that one page. When you touch the alien,
change both and `grep -c '<path'` to confirm they match. Hero graphics inside posts also use `var(--accent)` — they're
illustrations, not the mark, and should follow the theme.

## Blog

**Writing or editing an actual post? Use the `writing-a-blog-post` skill** —
it covers the markdown format, front matter, read-time and the publish step.
What follows is only how the blog wires into the deck.

**The `#blog` list is drawn at run time, not written into `index.html`.**
`deck.js` reads `blogs/blogs.txt` (slugs in display order — the pin is the
first line), fetches each post's front matter through `blogs/markdown.js`,
and builds the `.bpage` groups plus the `.segs`/`.tcount` indicator. Change
how the list *looks* in `listEntry()`/`drawBlogList()` in `deck.js`; the
markup is not in `index.html` to edit.

This is why `#blogtrack` starts empty and `tracks.blog` is null until the
fetch resolves — `makeTrack` measures children, so it cannot run before the
pages exist. If you touch that ordering, keep the late build.

**Post links are `blogs/?p=<slug>`.** They used to be
`blog/<slug>.html`, and those URLs were shared, so `404.html` — a router
with no chrome of its own — catches the old shape and redirects. Keep it.

- Post list is a deck screen (`#blog`, `$ ls ~/blogs`), reusing the exact
  `.projects` two-column shape as `ls ~/weekend-hacks`. Chosen over a
  separate `/blog/` index page — with the owner's ~10-post cap, an extra
  navigation hop buys nothing.
- **The deck is exactly three screens: `home → blog → projects`** (owner's
  cap, July 2026: "landing page not exceed more than 3 scrolls"). Blog
  comes before the projects because writing should precede the deep-dives.
  Three things must agree or the nav silently lies: DOM order of `.screen`,
  the order of `.rail` links (the observer maps them by index, not by
  href), and the window numbers in the labels. Posts' own two-window bar
  hardcodes `1:blogs` — it lives in `blogs/index.html`, so renumber it there
  once and every post follows.
- **The wip line is gone** (owner's call, July 2026). `$ ls
  ~/weekend-hacks/wip` and its "still a few unfinished weekend projects —
  updating soon" line were briefly folded onto the blog screen after
  `app-wip` was deleted; the owner then asked for the line removed
  outright. Don't reinstate a "coming soon" placeholder — an empty promise
  is worse than no line, and the blog screen is now one clean `$ ls ~/blogs`.
  The "first prompt has no top margin" rule is still scoped to
  `.detail-screen .content > .prompt:first-child` (+ the `.dither +` arm);
  keep it scoped rather than loosening to `.detail-screen .prompt`, so a
  screen that grows a second command later still reads right.
- **`mobile-recon` has no detail screen** (removed July 2026, same pass). It
  stays in the home `ls ~/weekend-hacks` list but links straight to the
  GitHub repo instead of an `#anchor`. `app-recon` was deleted as dead code.
  A project appearing on the landing does NOT imply it has a screen.
- **Window labels are display text, ids are not.** `0:whoami` (the landing,
  named for its first command — owner's call, July 2026) still points at
  `#home`; the label and the anchor are allowed to differ, and the same
  goes for the `blogs` labels below.
- **The visible label is `blogs`, the directory is still `blogs/`** (owner,
  July 2026). `$ ls ~/blogs`, `$ less ~/blogs/<slug>.md`, `$ cd ~/blogs`
  and the `1:blogs` window are all display text; the folder, the `href`s
  and the `#blog` anchor id were deliberately left alone because renaming
  the folder changes live GitHub Pages URLs and breaks any shared post
  link. The conceit was already fictional (`.md` on disk is `.html`), so a
  displayed path that doesn't match the repo path is consistent with it.
- Posts open with `$ less ~/blogs/<slug>.md` and close with `(END)` +
  `$ cd ~/blogs`. `less` was picked over `cat` (which the landing uses for
  short output) and over `man` (reserved for projects) because it's the
  pager you'd actually use on long text and it signals "this one scrolls."
- Post pages carry **no mac** and no snap — just the wordmark linking back to
  `../index.html#blog`, and a two-window tmux bar (`0:whoami`, `1:blogs`).
- Post bodies fade in as **one block** (`.blog.in`), not line-by-line. The
  `--i` print sequence is for terminal output; a 4-minute read printing
  55ms per line would be unusable. Only the header/prompt/title/meta use it,
  and `render.js` assigns those numbers at run time across whichever of the
  optional lines (repo, demo, hero) that post actually has.
- `#blog .projects .name` is widened to `12.5rem` — post slugs run longer
  than project names and wrapped mid-slug at the default `9.5rem`. Keep
  slugs ≤23 chars.
- Arriving at `index.html#blog` from a post re-runs the JS scroll (snap off →
  `scrollIntoView` → restore) on load, because the browser's native hash
  scroll is as unreliable under mandatory snap as the click case was.

## Design tokens (`:root`, defined in `style.css`)

```
--bg: #070807         page background
--text: #ccd3ca       primary text (bold lines, links' hover)
--text-dim: #8a9588   secondary text (most body copy)
--text-faint: #474f46 separators (·, →), faint icons
--accent: #4f9a60     links, project names, leet tokens
--green: #cf7a26      the "$ " prompt glyph — ONLY use for prompts
--surface / --surface-soft   inert fills: bars, code blocks, mac gauges
--rail-bg             the tmux bar's background
--grid-line           the deck's ambient pixel field
--ease-out: cubic-bezier(0.23, 1, 0.32, 1)   strong ease-out, used everywhere
```

**Matte finish — every theme (owner, July 2026: "all colour looks too
bright and I'm the dark mode person").** True-black backgrounds, text off
pure white, and accents *desaturated*, not merely darkened — a lit surface
rather than a glowing one. Surface fills, the ambient grid and the dither
tints were all brought down with them. Measured floors to hold if you
retune: body text ≥ 10:1, `--text-dim` ≥ 5.5:1, accent ≥ 5.5:1 against the
theme's own `--bg`; `--text-faint` sits at ~2.3:1 on purpose — it is a
separator, not text. Don't reintroduce a fully saturated accent.

**`--green` is a role, not a colour.** It means "the shell's own glyph", so
in the default green theme it holds amber — the accent had taken green and
the prompt has to stay distinct from the links. Never read `--green` as
"the colour green"; use `--accent` for anything that isn't a `$`.

### Accent toggle (July 2026, replaced the fixed blue palette)

Three themes, switched by swatches in the tmux bar: **phosphor** (green,
the default), **amber** (warm), **classic** (the original GitHub blue —
kept so the old look is still reachable). The owner asked for a mistral-ish
modern pass, chose the warm repaint, then chose green as the default and
asked for a toggle rather than a swap — don't quietly drop a theme.

- `theme.js` (repo root) is the single source: loaded **non-deferred in
  `<head>`** so it stamps `data-theme` before first paint, and it *injects*
  the swatch markup into `.rail` rather than having it pasted into
  `index.html` plus every post. Preference persists in `localStorage`
  under `mks-accent`. It also repaints `<meta name="theme-color">` (each
  theme carries its own `--bg`) and stamps the `©` year — both were
  duplicated markup before.
- The default theme gets **no `data-theme` attribute at all** — bare
  `:root` styles it. `DEFAULT` in `theme.js` and the bare `:root` block in
  `style.css` must name the same theme.
- Every theme block defines the **full** token set. A partial block
  inherits the default's greens and looks muddy on another background.
- `favicon.svg` can't follow the toggle (it loads outside the cascade), so
  it hardcodes the **default** theme's accent/bg. Change the default and
  you must repaint that file's two literals. `theme-color` *is* a real
  element, so it does follow — that asymmetry is deliberate.

Font: Fira Code, 14px, line-height 1.7. Don't introduce a second font or
break monospace anywhere — the terminal conceit depends on it.

**It is served from this repo** (July 2026), not Google: `fonts/` holds one
latin *variable* woff2 covering 400/500/600, declared `@font-face` in
`style.css` and preloaded by every page. That removed three render-blocking
third-party requests per page and stopped telling Google who read which post.
Don't re-add a `fonts.googleapis.com` link, and don't split the variable file
into static weights. SIL OFL 1.1 — `fonts/OFL.txt` ships with it and has to.

`→ ✔ ▲ ▶ ☕` render from the system monospace, not Fira Code: they fall
outside every subset Google ever published for this family, so this is
unchanged from before the self-hosting. Don't chase it with more subsets.

## Layout rules

- The page is a **scroll-snap deck** (`scroll-snap-type: y mandatory` on
  `html`): the landing (`#home`), the blog index (`#blog`), and `#projects`
  — which holds every project man page on one horizontal track rather than
  a screen each (see "Projects track" below). Each `.screen` is
  `min-height: 100dvh` flex-centered with `padding: 3rem 1.5rem`; inner
  wrapper `.inner` is `max-width: 720px` (940px on home + detail screens,
  whose text column `.content` caps at 500px so it clears the fixed mac).
  Never go back to a top-anchored layout with huge bottom whitespace —
  explicitly rejected ("looks like hanging on the top").
- Every section is a `<p class="prompt">` (green `$ command`) followed by
  `<div class="output">` / a result paragraph. New content should follow this
  exact pattern, not a departure into card/grid layouts.
- The header alien is an **inline SVG** (Noto Emoji U+1F47D paths, body
  recolored `var(--accent)`, eyes/mouth `var(--bg)`), duplicated as a
  hardcoded-hex data-URI favicon so every OS shows the identical mark. The
  `👽` emoji was standardized away on purpose — don't reintroduce it.
- **No horizontal divider lines between sections.** A `border-top` on the
  footer was tried and explicitly removed — a real shell never draws a rule
  between commands; blank space alone separates blocks. Don't reintroduce
  borders.
- Footer is **left-aligned**, not centered — it's a continuation of the
  terminal stream, not a separate "site footer" block. Centering it was tried
  and rejected for looking "separate."

## Projects track (July 2026 — replaced one screen per project)

`readback`, `pizow` and `mac-mlx-cluster` used to be a snap screen each.
They are now three `.card`s on one horizontal track inside `#projects`, so
the deck fits the owner's 3-scroll cap. The man-page markup inside each
card is unchanged.

- `.mantrack` is `overflow-x: auto` + `scroll-snap-type: x mandatory`;
  cards are `flex: 0 0 100%`. Nesting x-snap inside the deck's y-snap is
  fine — different axes — but keep the two declarations separate.
- **Do not call anything `.track`.** That class is already the readback mac
  app's now-playing line (`white-space: nowrap; overflow: hidden`). The
  carousel was briefly called `.track` and silently inherited both, so the
  man text stopped wrapping *and* the mac's demo line took the carousel's
  flex/overflow rules. Hence `.mantrack`.
- **Auto-advance, 7s a card, and it must never move text someone is
  reading.** Hover, focus, touch or a manual scroll holds it; it resumes
  10s after the last interaction; `prefers-reduced-motion` disables auto
  entirely and leaves the track swipeable. It only runs while `#projects`
  is the screen in view.
- Two *separate* state classes on `.tbar`: `.running` (auto is on at all —
  adds the countdown fill) and `.paused` (someone is engaged — freezes it).
  Folding them into one made a hover *remove* the countdown so the bar
  jumped to full, reading as "finished" instead of "paused".
- The indicator is three blocks + `1/3`. The active block's fill doubles as
  the countdown to the next advance, which is why no explanatory copy is
  needed next to it.
- `#projects` has **no mac app of its own** — the observer sets
  `mac.dataset.app` to the *live card's* id. Anything that assumes
  `data-app === screen.id` breaks here.
- The landing's `ls ~/weekend-hacks` links (`#readback` etc.) now point at
  cards, not screens. The nav resolves a card hash to its screen and slides
  the track to it; keep that path if you touch the anchor JS.

## Blog track (July 2026 — the same mechanism on `#blog`)

The post list outgrew one snap screen when the 2020 archive posts were
migrated in. Rather than a fourth screen (the 3-scroll cap is the owner's)
or a nested vertical scroll (which fights the deck's y-snap on iOS), the
list pages sideways with the *same* grammar as the projects track: owner's
call, July 2026, "slider more section in blogs if list keep incresing
design will not impact".

- **One factory drives both tracks.** `makeTrack(id, namesApp)` in
  `deck.js`; `tracks = { projects, blog }` is keyed by
  the screen id each lives on. Don't fork a second copy of the auto-advance
  logic — the pause/resume rules are subtle and were already gotten wrong
  once (see `.running` vs `.paused` above).
- `namesApp` is the only behavioural difference. `#projects` has no app of
  its own so its live *card* names the mac's app; `#blog` keeps `app-blog`
  and its track just pages the list.
- **Scope the indicator to its own screen.** With two `.tbar`s on the page,
  a bare `document.querySelector(".tbar")` grabs the projects one and the
  blog slider silently drives the wrong counter. The factory resolves
  `track.closest(".screen").querySelector(".tbar")`.
- Same for the tmux pane suffix: each `.pane` carries
  `data-track="mantrack|blogtrack"` and the factory looks up its own.
  Both windows now show one (`1:blogs.2`, `2:projects.1`).
- **Three posts per `.bpage`**, owner's pick over 4 or 5 — safest on the
  ~620px iOS viewport, and it matches the projects track's rhythm. At the
  ~10-post cap that's 4 pages.
- The `$ ls ~/blogs` prompt sits **outside** the track and does not slide.
  The command didn't change; only the page of output did.
- Auto-advance is **on**, same 7s/10s as projects (owner chose consistency
  over a manual-only slider). The never-move-text-someone-is-reading rule
  applies unchanged.
- Pages are flex items so they stretch to the tallest — a short last page
  does not make the indicator jump vertically. Verified: indicator holds
  the same y on a 3-post and a 2-post page.
- **`#projects` is the one screen where the mac sits LEFT** and the text
  reads right (`.mac.flip`, `#projects .inner { justify-content: flex-end }`,
  ≥1021px only). The flip is a `translateX(-580px)` — the exact mirror of
  `left: calc(50% + 90px)` for a 400px-wide mac — so it animates on the
  compositor instead of relaying out a fixed element.

## Alien pointer (July 2026)

The native arrow is replaced by **the site's own alien mark**, and anything
clickable gets the mark plus a block cursor beside it — that block is the
only affordance left once the arrow/hand cursors are gone, so never drop
it. It reuses the block-cursor motif the project rows already use on hover.

**A drawn UFO/saucer was built first and rejected** (owner: "not looks so
good") — it competed with the alien instead of reinforcing it. The site has
one mark; the pointer should be that mark, not a second alien-adjacent
icon. Don't re-propose a saucer, a rocket, or any other new glyph here.

- Paths are lifted from `favicon.svg`, **minus its highlight stroke** —
  that path is invisible at 28px and only lengthened the data URI.
- One sprite per theme, in `--ptr` / `--ptr-link`. A cursor image is a data
  URI outside the cascade, so it cannot read a custom property; the hexes
  are baked into each copy. Same duplication class as `favicon.svg` —
  retune the palette and these must be regenerated with it.
- The sprite follows the theme: alien in `--accent`, cut-outs in `--bg`,
  block cursor in `--accent`. Only the favicon is pinned green.
- Wrapped in `@media (hover: hover) and (pointer: fine)`. Touch has no
  cursor, and a 28px sprite on a coarse pointer is a hit-target problem.
- **The I-beam is kept over prose and code** (`p, li, pre, code, h…`).
  Posts are for reading; losing the text cursor across a 4-minute read
  costs more than the joke is worth. Links wrapping prose re-assert the
  pointer.
- Every value ends in `, auto`, so a browser that rejects the data URI
  falls back to a normal pointer rather than none.
- Hotspot is `4 4`, on the head's upper-left edge.

**The label (`pointer.js`, July 2026).** Hovering a link parks one lowercase
verb beside the block cursor — the sprite says "clickable", the word says
what the click *does*. Owner's ask: "whenever pointer reach to url we can
add text … meaningful, in front alien icon."

- Four verbs, and that's the whole vocabulary: **`open`** (external),
  **`read`** (a post, `?p=`), **`jump`** (in-page `#hash`), **`back`**
  (a post's `index.html#…` links). Owner picked the bare verb over
  command-style (`less <slug>.md`), "click to …" and destination text.
  Keep them one word — the label sits in the middle of the reading column
  and anything longer becomes a banner.
- It is a **real element**, not a fourth sprite: a cursor image is a data
  URI outside the cascade and cannot carry text. It follows the pointer via
  `pointermove` + one rAF, offset `42×6` — 42 clears the 40px `--ptr-link`
  sprite, and 6 lines the text up with the block cursor rather than the
  alien's head. It flips to the pointer's left near the right edge.
- Same `(hover: hover) and (pointer: fine)` gate as the sprite, plus a
  `pointerType !== "mouse"` bail: on touch there is no cursor to follow and
  the label would just be a box that appears after a tap.
- Hidden on `pointerdown`, `pointerleave`, window blur and any scroll —
  a parked pointer whose link scrolls away otherwise keeps a stale word.
- **Headless can't hover.** Verify by dispatching a synthetic
  `new PointerEvent("pointerover", {pointerType:"mouse", clientX, clientY})`
  at a link and reading `.ptrlabel` back through `--dump-dom`; the label is
  left visible so the same test copy screenshots.
- New script → add it to `FILES` in `tools/check-js.js`, or the gate
  silently skips it.

## Pixel-dither vocabulary (July 2026)

The owner asked for "a modern touch and animation, similar to mistral.ai".
What was taken from that site is its **pixel/dither motif**, translated into
the terminal — not its sans typography or card layouts. One vocabulary,
three uses, all `steps()`-timed so motion reads as cells dropping out rather
than as a soft crossfade:

- **Screen reveal** — `<span class="dither"><i><i><i></span>`, the first
  child of every `.content`. Three stacked checkerboards (solid → 18px →
  9px accent-tinted) fade out on staggered delays, ~520ms total, over the
  `.in` print running underneath. Gated by `.reveal.on` exactly like `.in`,
  and unpaused in the `<noscript>` block — miss either and below-the-fold
  screens stay black.
- **Project row hover** — an accent checkerboard wash behind the row
  (`opacity: .17`) plus a block cursor stepping in ahead of `.name`. This
  **replaced the hover underline** on project rows; the underline stays on
  `.cmdline`/footer links.
- **Description hover** — the `<b>` fragment gets an accent block-underline
  that wipes across in `steps(6)`. A full block *highlight* was tried and
  rejected: mid-sweep it puts light text on solid accent and contrast dies.
- **Mac app swap** — `.mac .mdither`, the same wipe one screen down. The
  apps used to plain-crossfade, the last soft transition on the page; now
  the swap happens behind block cells that coarsen away over ~420ms.
  Finer cells than the page reveal (12px/6px vs 18px/9px) because the lid
  is only 360px wide and the page's grid reads as three big squares at
  that size. **This is not lid motion** — the lid stays hardcoded open;
  don't let it become an excuse to reopen that rejected idea.
  Every app change goes through one `setApp(id)` in the script, which skips
  the wipe when the app hasn't actually changed (the observer re-fires on
  every crossing) and on the first set, which is page load. If you add a
  second place that writes `mac.dataset.app`, route it through `setApp`.
- **Ambient field** — `body::before`, a `--grid-line` grid masked to a soft
  centre, panning one 32px cell per 40s. Deck only. It needs `z-index: -1`;
  at `0` a fixed positioned layer paints *above* in-flow text.

Two gotchas worth keeping:

- The dither span is `.content`'s real first child, so
  `.content > .prompt:first-child` stopped matching on detail screens and
  the first `$` command grew a 2.5rem top margin. The rule now carries a
  `.dither + .prompt` arm. Still don't loosen it to `.detail-screen
  .prompt` — the blog screen's second command needs its margin.
- `color-mix()` in the tinted pass degrades to "no layer" on pre-2023
  browsers, which costs the sparkle but still completes the reveal. Fine.

The scroll hint follows the same "purposeful" rule: it was `--text-faint`
at 0.8rem and vanished into the background — now `--text-dim` at 0.85rem
with only the `#` faint, and its `↓` is accent-coloured and travels
downward on a loop instead of bobbing in place. It bottoms out at
`opacity: .18` rather than 0 and resets on that dim frame: the arrow sits
mid-sentence, and a glyph that fully disappears reads as a glitch.

## Entrance animation ("terminal print")

Every visible line has class `in` plus an inline `style="--i:N"` giving its
print order (0-indexed, sequential across the whole page — header is 0,
last footer line is highest). CSS:

```css
.in {
  opacity: 0;
  animation: printIn 320ms var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 55ms);
}
@keyframes printIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .in { animation-duration: 1ms; transform: none; }
}
```

This follows the `emil-design-eng` / `animation-vocabulary` skills in
`.agents/skills/`: entrances use ease-out, stay well under Emil's 300ms
ceiling (320ms total incl. fill), and the motion is *purposeful* — it
mimics a shell printing output line-by-line, not decorative fade-in.

**When adding a new line/section:** give it `class="in"` and
`style="--i:<next integer>"`, continuing the sequence from whatever the
current highest `--i` is. Don't reuse `nth-child` delays — the index
approach lets lines be added/reordered without recalculating every sibling.

Always verify a new animation or layout change by rendering with headless
Chrome and reading the screenshot back — don't just eyeball the diff:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --virtual-time-budget=2000 \
  --screenshot=/path/to/out.png --window-size=1800,1050 --hide-scrollbars \
  "file:///Users/mks/Desktop/C0D3/whoami/index.html"
```
Then `Read` the PNG. Check both the animated-in state (no budget flag) and
the settled end state (`--virtual-time-budget` past ~700ms) plus a mobile
width (~390px) to make sure nothing wraps or clips.

**Headless Chrome gotchas (learned the hard way):**
- Screenshots of fragment URLs (`index.html#pizow`) render blank — even for
  trivial pages. To verify below-the-fold screens, make a test copy of
  **`deck.css`** that replaces `min-height: 100dvh` (and the `100vh`
  fallback) with a fixed px height and drops `scroll-snap-type`, plus a test
  copy of `index.html` that pre-adds `on` to the `.reveal` sections and
  points at it; then screenshot the whole stack in one tall window. Since the
  split, a scratch copy of `index.html` must have **four** hrefs rewritten to
  absolute `file://` paths — `style.css`, `deck.css`, `theme.js`, `deck.js` —
  or you screenshot an unstyled, inert page.
- Window width clamps to 500px minimum (old and new headless). A
  `--window-size=390,…` screenshot is a 390px crop of a 500px layout — fake
  "overflow". To test true mobile width, constrain `body { width: 390px }`
  in the test copy, or probe `getBoundingClientRect().right > 391` from an
  injected script and read it back via `--dump-dom`.
- **Setting `scrollLeft` on a track does not fire its `scroll` handler here.**
  The assignment lands (reads back correctly) but the event is swallowed, so
  the indicator never resyncs and the slider looks broken when it isn't.
  `track.dispatchEvent(new Event("scroll"))` after the assignment exercises
  the real handler; that's how the blog track's page-2 resync was verified.
  A genuine swipe still has to be checked on a device.
- **Two overflow probes give false positives at mobile width.**
  `documentElement.scrollWidth` reports the 500px headless floor, not the
  390px test body — measure `document.body.scrollWidth` vs
  `body.clientWidth` instead. And "does any `li` extend past 391px" counts
  the *off-screen pages of a horizontal track*, which is the carousel
  working. Restrict the check to the visible page, then assert the track
  clips (`clientWidth` < `scrollWidth`) while the body does not.
- The `.mac` is `position: fixed`, so in a tall stacked-test window it sits
  at the bottom of the *whole* render, not per screen — crop the bottom band
  to inspect it. To force a specific app/lid state in a test copy, `sed` the
  markup to `class="mac open" data-app="pizow"` **and** strip the JS lines
  that overwrite it (`setLid`-style init call and
  `mac.dataset.app = e.target.id`), or the observer resets your forced state
  on load.

## Scroll experience & the mac

Architecture that emerged over many iterations (see history below before
proposing alternatives):

- **Reveal**: each detail screen restarts its `--i` print sequence at 0; its
  lines are `animation-play-state: paused` until an IntersectionObserver
  adds `.on` on first view. Keep the `<noscript>` fallback that unpauses.
- **Detail content grammar** matches the landing exactly: `$ cat
  ~/weekend-hacks/<name>/README.md` prompt → arrow-line title → three `›`
  points → `stack →` line → `$ git clone` / `$ open` cmdlines. Copy must be
  grounded in the real repo description/topics (`gh repo view`).
- `.prompt`/`.cmdline` have `overflow-wrap: anywhere` so long paths wrap
  like a real terminal on mobile — don't remove it.
- **The mac is the page's centerpiece gimmick.** A CSS-drawn open MacBook
  (`.mac`: lid + camera dot + base with notch), `position: fixed` on the
  right (`left: calc(50% + 90px)`, 400px wide, ≥1021px viewports). Its
  screen hosts one `.app` per section (`app-home` terminal lines,
  `app-readback` EQ bars + progress, `app-pizow` htop gauges, `app-mlx`
  gpu bar + typewriter, `app-blog` a `less(1)` pager whose text scrolls and
  whose status line counts up). The same IntersectionObserver that drives
  the rail sets `data-app = screen id`, crossfading apps as you scroll. All
  demo animation is CSS-only; the mac is `aria-hidden`.
- Adding a screen means adding its `.app` **and** its selector to the
  `.mac[data-app="…"]` list — miss the second and the mac just goes blank
  on that screen. Deleting a screen means deleting both, or the CSS rots.
- **Lid behavior: ALWAYS open, from first paint.** The markup hardcodes
  `class="mac open"`; there is no lid animation. Three earlier behaviors
  were built and rejected in sequence: scroll-position-linked lid angle
  ("accuracy not coming — minimum scrolling space"; snap gives no mid-scroll
  dwell), open-on-scroll/close-at-top ("lets the lid open only"), and a
  delayed open-once-on-load swing (owner, angrily: "I asked you to keep the
  lid open no effect on first load"). Do not reintroduce any lid motion.
  The closed-lid CSS (`rotateX(-84deg)` without `.open`) still exists but
  must never be user-visible.
- **Section nav is a tmux status bar** (`nav.rail`, restyled July 2026):
  thin bar pinned to the bottom edge, `[mks]` session name in green, each
  screen a numbered window (`0:whoami* 1:blogs 2:projects.1`), active one accent +
  starred (star width is pre-reserved so the bar never shifts). Driven by
  the same observer. `© year mks` (`.site-foot`) lives in its right corner
  like tmux right-status; session name + © hide ≤640px, tighter gap/font
  ≤440px (fits 360px), safe-area padded. It replaced a right-edge rail of
  square dots — chosen by the owner over vim-statusline, prompt-history
  rail, and ASCII scrollbar options.
- **The bar's width budget is tight — measure, don't estimate.** It's a
  single flex row with no wrap, so overflow silently pushes the last window
  off a narrow phone rather than wrapping visibly. Measured at the ≤440px
  tier: 5 windows = 284px (fits 360px with room), 7 full-length windows =
  384px (**overflowed a 360px screen by 24px**). Media queries key off the
  *viewport*, and headless Chrome clamps width to 500px, so a naive probe
  reports the wrong tier entirely — rewrite the breakpoints in a test copy
  to force the narrow tier, then sum the link widths + gaps + padding. If a
  future bar does run long, truncate the longest label the way real tmux
  truncates window names (a `<span>` inside the link, hidden at the narrow
  tier) rather than shrinking the font for everything.
- **Nav taps are JS-driven, not raw `#hash` jumps.** Hash anchors fight
  `scroll-snap-type: mandatory` on iOS Safari (taps land on the wrong
  screen / snap back — reported as "footer navigation buggy"; Android is
  fine). The script intercepts every `a[href^="#"]` click, sets
  `scrollSnapType = "none"`, drives a `scrollIntoView({behavior:"smooth"})`,
  updates the hash via `replaceState`, and restores snap on the `scrollend`
  event (iOS 16.4+) with a 1200ms timeout fallback. Don't revert to bare
  anchors. Bar links are `align-self: stretch` (fill the 28px strip height)
  because a text-height target is too thin in iOS's bottom gesture zone.
- **Mobile (≤1020px)**: the mac docks `position: fixed; bottom` centered,
  scaled 0.75 (0.68 ≤440px), and is hidden (`opacity: 0`) while
  `data-app="home"` so the landing stays a clean terminal; detail screens
  get `padding-bottom: 240px` so text clears it. The desktop `fadeIn`
  entrance is replaced by an opacity transition in this mode.
- **Short-viewport mac tiers (learned the hard way).** iOS Safari with
  scroll-snap **rarely collapses its URL bar**, so iPhones sit permanently
  at ~620–760px viewport *height* — a plain `max-height:700px { .mac
  opacity:0 }` rule removed the mac from iOS entirely while Android (which
  does collapse its toolbar → taller heights) kept it. Owner: "you removed
  the mac only from mobile, iOS specially". Correct shape is height tiers,
  not hide-or-show: **>760px** full mac (pad 240); **660–760px** half-scale
  mac (`scale(0.5)`, docked closer, pad 160) — the common iPhone state;
  **<660px** hidden (pad 3rem) for tiny/landscape only. Verify overlap by
  probing `.content` bottom vs `.mac` top at 573/660/673/760/790/853px.
- **`.screen` and `.detail-screen` have EQUAL specificity — source order
  decides.** Both are single class selectors, so a later
  `.screen { padding-bottom: … }` silently wipes out the mac-clearance tiers
  above it and the docked mac draws over the man pages. This has bitten
  twice: the `max-width: 540px` shorthand (fixed at the time, with a
  comment) and the `max-height: 840px` short-viewport block, which shipped
  broken and was caught July 2026. Measured at a 673px viewport, the padding
  collapsed to `2rem` — **27px**, because `style.css` drops the root font to
  13.5px at ≤640px — and `#projects` overlapped the mac by 17px. Scoping it
  to `.screen:not(.detail-screen)` restored +49px clearance. Before adding
  any `.screen` padding rule, check what it lands on top of.
- **Measuring mac overlap: use the content's offset *within its own screen*,
  not its viewport rect.** Only `#home` is in view in a static render, so
  the other screens sit a viewport or two down. `content.bottom −
  screen.top` equals the viewport position once that screen is snapped to
  the top; compare that to the fixed mac's `top`. Computing
  `(screenH + contentH) / 2` is **wrong** — content is centred in the
  *padding box*, so asymmetric padding shifts it and you will report
  overlaps that aren't real. Two more traps: the `.mac` is a child of
  `#home`, so a test copy that hides `#home` deletes the thing being
  measured; and `data-app="home"` renders it at `opacity: 0`, so a static
  render reports it invisible on every screen — read the geometry, not the
  opacity.
- **Modern mobile viewport handling** (added July 2026): `<meta
  viewport-fit=cover>` is REQUIRED — without it iOS reports every
  `env(safe-area-inset-*)` as 0 and all the safe-area padding silently
  no-ops. Screens use `min-height:100vh` then `100dvh` (dvh fallback for
  pre-2022 browsers; dvh re-evaluates as the toolbar collapses/expands).
  The tmux bar, `.site-foot`, and docked mac all pad by
  `env(safe-area-inset-bottom)`; bar side padding uses
  `max(1rem, env(safe-area-inset-left/right))` to clear notch corners in
  landscape.
- Reduced motion: lid always open, apps swap instantly, all loops off.

**Design history for the right side (don't re-propose losers):** giant faint
emoji glyphs — built, then reverted ("not looking good"); static ASCII flow
diagrams — rejected unseen ("too boring"); bordered tmux-style demo panes
beside each project — loved ("damm this looks coool") but later folded into
the mac's screen at the owner's idea. Lesson: filler must be *alive and
specific to the project*, not decorative. Cold-brew glass beside the mac
(CSS-drawn tumbler, floating ice, level dropped + ice melted with scroll) —
iterated through many rounds (icons → big cubes → bottom pile → floating
per physics; brown → darker brown → accent blue) and ultimately **removed**:
owner felt coffee "doesn't fit the theme" and cut it even in on-palette
blue. Don't re-propose desk props next to the mac; the footer's
`brew install cold-brew` pun carries the coffee joke alone.

## Content voice — hard-won rules

The user rejected several drafts before landing on the current copy. Do not
drift back toward these rejected patterns:

- **No forced wordplay / cutesy metaphors.** Lines like "the repos tell on
  me", "nightly build", "exit code" were explicitly called out as bullshit.
  Prefer a plain, dry, self-aware statement over a clever pun.
- **No invented identity flourishes.** Don't add "typical", corporate-sounding
  filler, or reach for generic hacker-tinkerer tropes not grounded in the
  user's actual repos/photos.
- **Ground copy in real evidence.** When stuck for a line, check the user's
  actual GitHub repos (`gh repo list MKS-01`) or supplied photos before
  guessing — the "robots, LoRa radios, reverse-engineered wearables, offline
  LLMs" angle came directly from auditing repo names/descriptions.
- **The user writes the real line; you tighten grammar.** Several times the
  final copy was the user's own phrasing verbatim (e.g. the current whoami
  bio) — don't override their wording with something "more creative" once
  they've stated it. Fix wrapping/length/punctuation only.
- Current whoami (do not casually rewrite):
  ```
  senior software engineering lead by day.
  tinkerer at heart — while awake: explore, build, break, repeat.
  ```
  The "explore, build, break, repeat" deliberately echoes the `<title>` tag's
  "coffee → code → tinker → repeat".
- Footer sign-off is a `brew install` pun (Homebrew *and* brewing coffee) —
  `# required dependency` is the punchline; keep the joke self-contained,
  don't stack more jokes onto it.
- Project descriptions are single arrow-lines (`X → Y, detail`), not
  paragraphs. Keep new project entries in that exact terse shape.

## When asked to change design/content

1. Check current repo state (`gh repo list MKS-01`) or ask for the concrete
   input (book title, project name) rather than inventing detail.
2. Propose 2–4 concrete options via AskUserQuestion when the direction is a
   creative/subjective choice (copy, layout style) — this project's owner
   consistently prefers picking from real options over open-ended prose.
3. Make the edit, render + screenshot to verify, then report — don't ask
   "does this look good?" without having looked yourself first.
4. Don't commit unless explicitly asked to.
