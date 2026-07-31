---
name: writing-a-blog-post
description: How to write and publish a post on mks.sh — the blogs/*.md format and front matter, the less(1) conceit, the markdown subset, read-time, and the one-command publish step. Use whenever adding, drafting, editing, or removing a blog post.
---

# Writing a post for mks.sh

A post is one markdown file: `blogs/<slug>.md`, front matter plus prose.
**There is no per-post HTML file** — `blogs/index.html` is the single page that
serves every post, rendering `?p=<slug>` in the browser via `blogs/render.js`
(owner's call, July 2026: *"single html template for blog and to avoid
multiple blog html, post format in markdown"*). Adding a post never adds an
HTML file; don't create one.

`bun run check` does not touch posts. Its only job is the list
on the landing page, because nothing in a browser can enumerate a directory.

Two stylesheets do all the work — `../style.css` supplies every token and the
terminal grammar, `blog.css` supplies the prose rhythm. There is nowhere in
a `.md` to put CSS, on purpose: if you want a rule, it belongs in
`blogs/blog.css` where every post gets it.

Read **`portfolio-conventions`** first for the design system and the site's
voice rules — this skill only covers what's specific to posts.

## Before writing: get the content from the owner

**Do not invent a post.** The site's voice rules are explicit that the owner
writes the real line and you tighten grammar, and a blog is the worst place
to guess — a post is a first-person claim about what they did, tried, or
believe. Inventing one puts words in their mouth.

So: ask for the angle, or build the post from evidence you can actually
read (this repo, `gh repo view MKS-01/<name>`, a real commit history, a
transcript of what they just told you). If you draft prose to move things
along, **say plainly that it's your draft and needs their pass** — don't
hand it over as finished.

Evidence beats memory even when the owner has told you the story: for
`why-i-built-readback`, the owner supplied the motivation and the arc, and
`readback/docs/JOURNEY.md` plus `git log` supplied the dates, version
numbers and the detail he'd forgotten (he swapped the TTS engine out on day
two and came back to it 5 weeks later). Ask for the *why*, then go read the
repo for the *what*.

A first draft written this way is still a draft — a post about the owner's
own reasoning that he didn't write is the thing to flag hardest. An earlier
`how-this-site-works` post was drafted from this repo's code, correctly
labelled as a draft, and deleted unread for exactly this reason.

## Publishing = 1 file + 1 command

```bash
cp blogs/_template.md blogs/<slug>.md
$EDITOR blogs/<slug>.md
add its slug to blogs/blogs.txt   # that is the whole publish step
```

Posts live **flat in `blogs/`**, beside the page that renders them — there is
no `posts/` subdirectory, and the folder matches the `~/blogs` the site has
always displayed.

The post is live at `blogs/?p=<slug>` the moment the `.md` exists.
Removing one is `rm blogs/<slug>.md` plus the same command.

Front matter:

| key | | |
|---|---|---|
| `title` | required | lowercase fragment; the `<h2>` and the `<title>` |
| `date` | required | `YYYY-MM-DD` |
| `desc` | required | one dry sentence — `<meta description>` + the og: card |
| `blurb` | required | one dry line — the `ls` entry on the blog screen |
| `pinned` | optional | `true` holds the top of the list whatever the date |
| `updated` | optional | `YYYY-MM-DD`, only once it differs from `date` |
| `repo` | optional | `MKS-01/<repo>` → the `git clone` line |
| `demo` | optional | a host/path → an `open` line under it |

`desc` and `blurb` are **different strings** and always were — one is the
share card, one is the terse `ls -l` column. Don't collapse them.

**Everything else is computed. Don't try to set it by hand:**

- **read time** — `words ÷ 200`, rounded, min 1, code blocks and the hero
  excluded. It lands in the post's meta line and the list entry at once, so
  the two can no longer contradict each other.
- **`--i` print order** — including the shift when a post has a repo line,
  a demo line or a hero.
- **the list** — entry markup, ordering (pinned first, then newest), the
  three-per-`.bpage` balance, and `.segs`/`.tcount` when a page opens or
  closes.

Read time comes from `readTime()` in `blogs/markdown.js`, which both the
post page and the landing list import — one implementation, so the two can
no longer disagree. Don't fork it.

(There is no longer a wip line under the list — removed July 2026; don't
re-add a "coming soon" placeholder.)

**`why-i-built-readback` carries `pinned: true`** (owner, July 2026) and
holds the top slot whatever its date, so the list is not purely
newest-first. Its `.meta` reads `pinned · YYYY-MM-DD · N min` while every
other entry starts with the date. The out-of-order dates are deliberate —
don't "fix" them by dropping the pin, because without the word the ordering
just reads as a bug.

The list is paged three per `.bpage` (see `portfolio-conventions` → "Blog
track"). The generator balances the pages and updates the indicator; `--i`
keeps running across pages (page 2 starts at 4, not 1) because it is a print
order, not a per-page index. The `.meta` lives *inside* `.desc` on purpose:
`.projects a` is a two-item flex row, and a third child would become a third
column.

Slugs: lowercase, hyphenated, **≤23 characters** — longer ones wrap the name
column. The slug is the filename, the list label, and the path in the
`$ less` prompt, and it is now literally one value, so they cannot drift. The
build fails on a longer one.

Owner caps the blog at ~10 posts and the build enforces it. At the cap,
removing the oldest is part of adding a new one — **ask which goes.**

## Shape: a post is not a story

**This is the rule that decides whether a post is any good.** Owner, July
2026: *"blogs is not always story… story in first 2-3 line and last summary
and then focus on type of blog — if technical topic then 85% focus around
technical reader and contents."*

```
opening      2–3 lines. Why this exists / what pulled you in. That's ALL
             the narrative the top of the post gets.
body         ~85% of the words. Matched to the post's type — for a
             technical post, written for a technical reader: the design,
             the constraint, the number, the tradeoff, the thing that
             broke and why.
close        a short summary. Where it landed, what it's for now.
```

The failure mode to avoid — and the one the first drafts of both existing
posts fell into — is spreading the personal narrative across the whole
piece: an origin section, a feelings section, a "what it means to me"
section, with the engineering sprinkled between them. The story is the
*hook*, not the *structure*.

Concretely, for a technical post:

- Front-load the substance. A reader who came for how the thing works
  should hit real content within a screen of the title.
- Every section after the opening should teach something: an architecture
  decision, a constraint and what it forced, a measurement, a failure.
- Personal beats belong inline, one sentence at a time, attached to a
  technical point — "the USB port caps at 500 mA, which cost me an evening"
  — not as their own section.
- The closing summary can be personal again. That's the one place it earns
  a paragraph.

Non-technical posts (a reading list, an opinion) rebalance accordingly —
but the 2-3 line open and the short close hold for every post.

## Anatomy of a post page

Fixed scaffold, in order. It lives in `blogs/index.html` — one page for all
posts — and you get it for free. Change it there and every post changes;
don't restructure it:

```
header (wordmark, links back to ../index.html#blog)   --i:0
$ less ~/blogs/<slug>.md                              --i:1
# post title                                          --i:2
written YYYY-MM-DD · N min                            --i:3
$ git clone github.com/MKS-01/<repo>       optional   --i:4
$ open <demo url>                          optional
[hero <figure>]                            optional
.blog  ← the whole body, ONE fade
(END)
$ cd ~/blogs
tmux bar: [mks] 0:whoami 1:blogs*
```

The optional lines shift everything after them, which is why `render.js`
assigns `--i` at run time over the visible steps only. The entrance print is
held by `body:not(.ready)` in `blog.css` until the fetched body is in the
DOM — without that every line animates while still empty. The alien SVG in
that header is now one of only two copies site-wide (here and
`index.html`).

- The `less` framing is deliberate: `cat` is the landing's verb for short
  output, `man` belongs to projects, `less` is the pager you'd actually use
  on long text. Open with `$ less`, close with `(END)` + `$ cd ~/blogs`.
- **The body fades in as one block.** `--i` is for terminal output printing
  line-by-line; a 4-minute read at 55ms/line would be unusable. Never put
  `--i` on individual paragraphs.
- Posts carry **no mac and no scroll-snap**. Both belong to the deck.
- **A post about a project links its repo**, as a `.cmdline` directly under
  the meta line — `git clone github.com/MKS-01/<repo>`. Same grammar the
  project screens use in their SEE ALSO block, so don't invent a link style
  or a footer button. Link text drops the `https://`; the `href` keeps it.
  Add an `open <url>` line beneath it only when there's a live demo.

## Prose markup

A deliberately small markdown subset — exactly what these posts use.
Everything below is styled already; don't invent classes or reach for inline
styles.

| Want | Write |
|---|---|
| paragraph | a block of lines, blank line between |
| section heading | `## the deck` |
| sub-heading | `### …` |
| emphasis | `**…**` |
| link | `[text](https://…)` |
| inline code | `` `…` `` |
| code block | a ``` fence |
| `$` prompt in a block | `<span class="g">$</span>`, inside the fence |
| comment in a block | `<span class="c"># …</span>`, inside the fence |
| list | `- item` lines |
| pull quote | `> …` |
| table | a raw HTML block (below) |

Those two `<span>`s are the only markup that survives inside a fence —
everything else there is escaped, so write `<uuid>` and get `&lt;uuid&gt;`.
You no longer escape anything by hand.

**Line breaks inside a paragraph are preserved**, so wrap the markdown the
way you want the HTML to wrap. Headings still get their `##` from CSS —
write `## the deck`, and the rendered page prints `## the deck` once, not
twice.

### Raw HTML blocks

Anything the subset can't express — a `.hero` figure, a table — is written
as raw HTML and passes through untouched. **The opening tag starts at column
0 and the closing tag starts at column 0**; that's how the parser finds the
end.

```html
<div class="scroll-x">
<table>
  <tr><td><code>a</code></td><td>a row</td></tr>
</table>
</div>
```

This is an escape hatch, not the default. If you're reaching for it for
ordinary prose, you're fighting the format.

## Hero diagram (optional)

A post may open with an inline SVG diagram between the meta line and the
body. Write it as a **raw HTML block at the very top of the markdown**,
before any prose, as `<figure class="hero">` with a `<figcaption>` — the
generator hoists it out of `.blog`, adds the `in` class and its `--i`, and
leaves its words out of the read time. Rules:

- **Draw the architecture, not decoration.** The owner approved a hero for
  `why-i-built-readback` because it carries the post's argument (a pipeline
  forking into two clients). Ornamental art has repeatedly lost on this site
  — see the rejected-ideas list in `portfolio-conventions`.
- **Site visual language, not a foreign style:** `stroke="var(--text-faint)"`
  at 1.5px, `rx="6"`, `fill="rgba(139,148,158,0.05)"` — the same treatment as
  the CSS MacBook. `var(--accent)` marks the one box that matters. Labels in
  `Fira Code, monospace`. Never hardcode a hex.
- **Inline SVG only** — no raster asset, no external file, no icon library.
- Give it `role="img"` + `<title id=…>` referenced by `aria-labelledby`,
  written as a sentence a screen reader can use.
- **Sub-labels must drop out on mobile.** A 560-wide viewBox renders at
  ~356px on a 390px phone — a scale of 0.64, which turns 10px detail labels
  into **6.4px mush**. Tag them `class="sub"` and hide below 540px; keep
  primary labels at 14–16px so they land near 10px. Measure it, don't guess:
  render at 390px and read the screenshot.
- **Tag the shapes too, not just their labels.** `.hero .sub` hides any
  element, and a shape whose label just vanished is worse than no shape —
  the pi-board hero first shipped with `microsd`, `wifi` and three port
  rects tagged only on their `<text>`, so on a phone the board became an
  empty square, a stray zigzag and three blank boxes. If a shape means
  nothing without its label, put `class="sub"` on the shape as well so they
  disappear together.
- **Keep one identifying label out of `.sub`.** Hide everything and the
  subject goes anonymous. The board keeps
  `raspberry pi zero 2 w · 512 mb ram` at 14px, unhidden, so the mobile
  render still says what it's a picture of. Decide which single label that
  is before tagging the rest.
- Detail that survives at 0.64 scale is chunky: a strip of ticks reads as a
  GPIO header, a 2px circle reads as dirt. Prefer few bold shapes over many
  fine ones.

**Headings already get their hashes from CSS** (`h2::before { content: "## " }`).
Write `<h2>the deck</h2>`, never `<h2>## the deck</h2>` — you'll get `## ## `.
Same for the title's single `#`.

Escape `<` and `>` inside `<pre>` as `&lt;` / `&gt;`, or the browser eats
your example markup.

Headings are lowercase, like every other command and label on the site.

Long lines inside `<pre>` are fine — code blocks scroll in their own
container so the page body never scrolls sideways on a phone. Don't add
`white-space: pre-wrap` to "fix" a wide block; the scroll is the design.

## Dates: meta line only, never in prose

The meta line under the title carries **when the post was written**, and
**when it was last updated** once that differs:

```
written 2026-07-21 · 5 min                          new post
written 2026-07-21 · updated 2026-09-02 · 5 min     after a real edit
```

Omit `updated` while it would just repeat `written` — two identical dates
is noise. Add it when you materially change the content, not for a typo fix.
The blog-screen `<li>` carries no date; the post page is where it lives.

**No calendar dates anywhere in the body.** (Owner: *"remove the date part
it might be incorrect"*.) Dates reconstructed from `git log` are a trap —
commit timestamps record when a commit landed, not when the work happened,
and rebases, squashes and imported history all move them. "First commit,
6 May" states a fact the reader can check and you can't.

Write the shape of the timeline instead, which stays true regardless:

- "the first commit", not "the first commit, 6 May"
- "then nothing — months of it", not "28 February to 13 June"
- "it went from a demo to something I use", not "two months from…"

Soft relative beats ("a week later", "when I finally came back") are fine.
Version numbers (`v0.8.0`, `v2.0.0`) are fine — they're facts about the
repo, not claims about the calendar.

## Length: short. 2–3 minutes, 5 is the hard ceiling

**Default to 2–3 minutes.** (Owner, July 2026: *"keep the blog also short
keep it 2mins"* — said while cutting `home-server-on-512mb` from 4 min to
2.) An earlier draft of this rule set the floor at 3 min and called anything
shorter too thin; that was wrong, and the owner overruled it. Short is the
preference, not a failure state.

**No post exceeds 5 minutes**, still.

Read time is `words ÷ 200`, rounded, minimum 1 — prose only; code blocks and
the hero don't count. **The generator computes it**, so you can't
accidentally ship a padded figure, but you still have to write to the
budget:

```
2 min   ~400 words     the default — aim here first
3 min   ~600 words     fine when the material earns it
5 min   ~1000 words    HARD CEILING — do not ship over this
```

At 400 words you get an opening, three or four `<h2>`s and a one-paragraph
close. That's the whole budget. Pick the three things worth saying and drop
the rest — `home-server-on-512mb` lost its NAS internals, the 500 mA note
and a Claude Code section to fit, and reads better for it.

Nothing enforces the ceiling any more — the generator that used to refuse
an over-length post is gone. Count before you publish, and keep to the
budget yourself; the numbers above are the whole story.

**When you land over 1000 words, cut in this order:**

1. **Narrative.** The 85% rule means story is already meant to be a hook and
   a close — if the piece is long, that's usually where the fat is.
2. **Restating.** A section that re-explains a point made earlier in
   different words. Say it once, in the strongest place.
3. **Second examples.** One well-chosen number or failure beats three.
4. **Merge sections.** Two thin `<h2>`s covering one idea should be one.

**Do not cut the technical substance to fit** — that inverts the whole
point. If the material genuinely needs more than 1000 words, it's two posts,
not one long one. Split on a real seam (architecture vs. the debugging
story) and cross-link them.

## Voice

Inherits the site's rules (no forced wordplay, no invented flourishes, dry
and self-aware). Post-specific:

- **Lead with the thing, not a warm-up.** No "in this post I'll…", no
  throat-clearing about how long it's been since the last one.
- **Concrete over general.** The measured number, the actual error, the
  exact line that fixed it. `why-i-built-readback` earns its keep by naming
  `_tidy_silence`, the ~300ms pause cap and the day-two engine swap — not by
  talking about simplicity in the abstract.
- **Own the mistake.** The posts worth reading here are the ones where
  something behaved badly and the reason turned out to be specific. Write
  the wrong assumption, then what actually happened.
- **Stop when it's done.** No "conclusion" section restating the post, no
  call to action, no asking for feedback.
- Title is a lowercase fragment, not a headline: `how this site works`, not
  `How This Site Works: A Deep Dive`.

## Verify before reporting

⚠️ **You cannot verify a post over `file://`.** `fetch` is blocked there, so
the page shows its "can't load" message and you'll think you broke it. Serve
the repo, then screenshot over localhost:

```bash
bun run dev     # http://localhost:3000
```

Then render and **read the screenshot**, desktop and narrow.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --virtual-time-budget=2500 \
  --screenshot=/tmp/post.png --window-size=1400,1000 --hide-scrollbars \
  "http://localhost:3000/blogs/?p=<slug>"
```

Post pages are ordinary scrolling documents, so unlike the deck they
screenshot directly — no test-copy trick needed, just the server.

For mobile, headless clamps the window to 500px, so inject
`body { width: 390px }` with an added `<style>` — served over localhost the
sheets resolve normally, so no href rewriting is needed any more.

Then confirm the page body itself doesn't overflow while wide `<pre>` blocks
scroll internally — that split is the thing to check. Measured on
`home-server-on-512mb` at 390px: `body` 390, `pre` box 342, `pre` scrollWidth
457. Body at exactly 390 with `pre` scrolling past it is the pass condition;
a body wider than 390 is the failure.

Then confirm `bun run check` is clean, so the Pages workflow won't reject
the deploy. The old checklist here — that the `<li>`
points at a file that exists, that the slug matches in three places, that
`--i` was renumbered — is all now structurally impossible to get wrong.

## Don't

- Don't create a `blog/<slug>.html`. There is one post page and it is
  `blogs/index.html`; per-post files are exactly what the owner asked to be
  rid of. Edit the `.md`.
- Don't delete `404.html`. Posts used to live at `/blog/<slug>.html` and
  those links were shared; it is the only thing keeping them working.
- Don't put anything post-specific in `style.css` — it's shared with the
  deck. Rules shared by posts go in `blogs/blog.css`. A `.md` has no slot for
  CSS at all, which is the point.
- Don't add `scroll-snap-type` to a post, ever — not in the post, not in
  `blog.css`. See `portfolio-conventions`.
- Don't re-inline the favicon as a data-URI. Posts link `../favicon.svg`;
  inlining it is what let the mark drift last time.
- Don't add a dependency. The generator is Python 3 stdlib and the *site*
  depends on nothing at all — the HTML is committed and served as-is. A
  runtime markdown renderer, a syntax highlighter or an RSS builder that has
  to run before the page works would cross the line the build step doesn't.
  If the markdown subset can't express something, use a raw HTML block; if
  that keeps happening, widen the parser rather than importing one.
- Don't add horizontal rules between sections — the site's no-divider rule
  applies inside posts too. Blank space separates blocks.
- Don't commit or push unless asked. Pages deploys off `main`, so a push is
  publication.
