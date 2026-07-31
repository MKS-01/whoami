# mks.sh

👽 The home for all the weekend hacks and the blogs about them, styled as a
terminal session — coffee → code → tinker → repeat.
Live at [mks-01.github.io/whoami](https://mks-01.github.io/whoami/).

No framework, no dependencies, no build. `package.json` is scripts only —
there is no lockfile and no `node_modules`, so this clones and runs.

## Running it

```bash
bun run dev      # http://localhost:3000
bun run check    # parse every script, load every post — what CI runs
```

`bun run dev` imitates GitHub Pages on purpose (directory indexes, unknown
paths served from `404.html`), so redirects behave locally the way they do
deployed.

The landing page opens straight off disk. **A blog post does not** — it is
fetched and rendered in the browser, and `fetch` is blocked on `file://`,
so posts need the server.

## Writing a post

```bash
cp blogs/_template.md blogs/<slug>.md
$EDITOR blogs/<slug>.md
echo "<slug>" >> blogs/blogs.txt     # position = list order; first = pinned
```

That's the whole step. No HTML file to create, no list entry to paste, no
read time to count — the title, date, blurb and read time live only in the
post's front matter, and the landing list is drawn from it.

## Layout

```
index.html            the deck: whoami, the blogs, the weekend hacks
deck.css  deck.js     deck-only styling and behaviour
style.css             shared by both kinds of page: tokens, @font-face,
                      the terminal grammar, the tmux status bar
theme.js              accent toggle, theme-color, the © year
404.html              router: keeps old /blog/<slug>.html links working

blogs/  index.html    ONE page renders every post → /blogs/?p=<slug>
        render.js     its wiring
        markdown.js   the markdown parser — the only copy, shared with
                      the landing page's post list
        blog.css      prose styling
        blogs.txt     slugs in display order
        <slug>.md     the posts

fonts/                Fira Code, latin subset, self-hosted
tools/                dev server and the checks
```

## Deploying

Push to `main`. The workflow parses every script and loads every post
before it will deploy — nothing is compiled here, so a syntax error or a
broken post would otherwise reach a visitor as a blank page rather than a
failed build.

`blogs/*.md` and `blogs/blogs.txt` are **runtime assets**: the browser
fetches them. The whole repo ships, and they have to stay in it.

## Licence

[MIT](LICENSE).
