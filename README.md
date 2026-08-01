# mks.sh

👽 Weekend hacks and the posts about them, styled as a terminal session —
coffee → code → tinker → repeat.
Live at [mks-01.github.io/whoami](https://mks-01.github.io/whoami/).

No framework, no dependencies, no build — this clones and runs.

## Running it

```bash
bun run dev      # http://localhost:3000
bun run check    # what CI runs before it deploys
```

The landing page opens straight off disk. **A post does not** — it is
fetched and rendered in the browser, and `fetch` is blocked on `file://`,
so posts need the server.

## Writing a post

```bash
cp blogs/_template.md blogs/<slug>.md
$EDITOR blogs/<slug>.md
echo "<slug>" >> blogs/blogs.txt     # position = list order; first = pinned
```

That's the whole step — no HTML to create, no list entry to paste, no read
time to count.

## Licence

[MIT](LICENSE).
