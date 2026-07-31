/* ── the content gate ─────────────────────────────────────────────────
   bun run check   →   every post is loadable before it deploys.

   Posts render in the browser now, so a broken one is not a build error —
   it is a blank page a visitor finds. The Python generator used to catch
   this by failing the build; it's gone, and this replaces it.

   It imports blogs/markdown.js: the *same* parser the browser runs, not a
   reimplementation of it. A post that parses here parses there.
   ─────────────────────────────────────────────────────────────────── */
import { file, Glob } from "bun";
import { parseFrontMatter, renderBody, splitHero, readTime } from "../blogs/markdown.js";

const ROOT = new URL("..", import.meta.url).pathname;
const BLOGS = `${ROOT}blogs/`;

/* the owner's rules — enforced here since no build enforces them now */
const MAX_POSTS = 10;
const MAX_SLUG = 23;
const MAX_WORDS = 1000;
const REQUIRED = ["title", "date", "desc", "blurb"];

const problems = [];
const fail = (where, why) => problems.push(`${where}: ${why}`);

/* ── the order file ──────────────────────────────────────────────────
   blogs.txt is the one thing a browser can't work out for itself, which
   makes it the one thing that can silently disagree with reality. */
const listFile = file(`${BLOGS}blogs.txt`);
if (!(await listFile.exists())) {
  console.error("blogs/blogs.txt is missing — the landing list reads it");
  process.exit(1);
}

const slugs = (await listFile.text()).split("\n").map((s) => s.trim()).filter(Boolean);

if (!slugs.length) fail("blogs/blogs.txt", "is empty, so the blog screen would render nothing");
if (slugs.length > MAX_POSTS) {
  fail("blogs/blogs.txt", `${slugs.length} posts, the cap is ${MAX_POSTS} — ` +
       "removing the oldest is part of adding a new one");
}
for (const [i, slug] of slugs.entries()) {
  if (slugs.indexOf(slug) !== i) fail("blogs/blogs.txt", `${slug} is listed twice`);
  if (slug.length > MAX_SLUG) {
    fail(slug, `slug is ${slug.length} chars, max is ${MAX_SLUG} — longer ones wrap the name column`);
  }
  if (!/^[a-z0-9-]+$/.test(slug)) fail(slug, "slug must be lowercase, digits and hyphens only");
}

/* ── every listed post actually loads ────────────────────────────────
   Rendering the body here is the point: it is what catches an unclosed
   ``` fence or a raw HTML block that never closes, which would otherwise
   throw in the browser and leave the reader a blank page. */
for (const slug of slugs) {
  const md = file(`${BLOGS}${slug}.md`);
  if (!(await md.exists())) {
    fail(slug, "listed in blogs.txt but blogs/" + slug + ".md does not exist");
    continue;
  }

  let meta, body;
  try {
    ({ meta, body } = parseFrontMatter(await md.text()));
  } catch (e) {
    fail(slug, `front matter — ${e.message}`);
    continue;
  }

  for (const key of REQUIRED) {
    if (!meta[key]) fail(slug, `front matter is missing \`${key}\``);
  }
  for (const key of ["date", "updated"]) {
    if (meta[key] && !/^\d{4}-\d{2}-\d{2}$/.test(meta[key])) {
      fail(slug, `\`${key}\` must be YYYY-MM-DD, got "${meta[key]}"`);
    }
  }

  let rendered;
  try {
    rendered = splitHero(renderBody(body)).body;
  } catch (e) {
    fail(slug, `body doesn't render — ${e.message}`);
    continue;
  }

  const prose = rendered.replace(/<pre>[\s\S]*?<\/pre>/g, " ").replace(/<[^>]+>/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  if (words > MAX_WORDS) {
    fail(slug, `${words} words, the hard ceiling is ${MAX_WORDS} (5 min) — ` +
         "cut it or split it into two posts");
  }

  const pin = meta.pinned === "true" ? " (pinned)" : "";
  console.log(`  ok    ${slug.padEnd(24)} ${String(words).padStart(4)} words · ` +
              `${readTime(rendered)} min${pin}`);
}

/* ── a post nobody can reach ─────────────────────────────────────────
   Forgetting the blogs.txt line is the easiest mistake in the new flow:
   the .md deploys, the URL works, and it appears nowhere on the site. */
for await (const name of new Glob("*.md").scan(BLOGS)) {
  const slug = name.replace(/\.md$/, "");
  if (slug.startsWith("_") || slugs.includes(slug)) continue;
  fail(slug, "has a .md but is not in blogs.txt, so nothing links to it");
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`\n${slugs.length} posts, all load`);
