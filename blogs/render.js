/* ── the post page ────────────────────────────────────────────────────
   One page — blogs/index.html — serves every post. This reads `?p=<slug>`
   and renders blogs/<slug>.md into it. The markdown itself is parsed by
   markdown.js, which the landing page's post list also imports, so there is
   exactly one implementation of the format and one read-time formula.

   ⚠ fetch() cannot read file:// URLs, so a post opened straight off disk
   shows the "can't load" message. Serve the repo to preview:
       bun run dev   →   localhost:3000/blogs/?p=<slug>
   The deployed site is over https, where this is a non-issue. ─────── */
import { esc, loadPost } from "./markdown.js";

const el = (id) => document.getElementById(id);

/* Numbering the print order last is what lets the optional lines (repo,
   demo, hero) be present or absent without leaving a gap in the sequence.
   .ready releases the entrance animation, which blog.css holds until the
   fetched body is actually in the DOM. */
const printOrder = () => {
  let step = 0;
  for (const node of document.querySelectorAll(".wrap .in")) {
    if (!node.hidden) node.style.setProperty("--i", step++);
  }
  document.body.classList.add("ready");
};

const fail = (message) => {
  el("blog-title").textContent = "not found";
  el("blog-body").innerHTML = `<p>${message}</p>`;
  document.title = "not found — mks.sh";
  printOrder();
};

/* The slug comes from ?p=, or from a legacy /blog(s)/<slug>.html path that
   404.html hands over — every link ever shared stays good. */
const slugFromLocation = () => {
  const query = /[?&]p=([A-Za-z0-9-]+)/.exec(location.search);
  if (query) return query[1];
  const path = /\/blogs?\/([A-Za-z0-9-]+)\.html$/.exec(location.pathname);
  return path && path[1] !== "index" ? path[1] : null;
};

const draw = ({ slug, meta, hero, body, minutes }) => {
  let line = `written ${meta.date}`;
  if (meta.updated) line += ` · updated ${meta.updated}`;
  line += ` · ${minutes} min`;

  document.title = `${meta.title} — mks.sh`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && meta.desc) desc.setAttribute("content", meta.desc);

  el("blog-cmd").textContent = `less ~/blogs/${slug}.md`;
  el("blog-title").textContent = meta.title;
  el("blog-meta").textContent = line;

  if (meta.repo) {
    el("blog-repo").innerHTML =
      `git clone <a href="https://github.com/${meta.repo}">github.com/${meta.repo}</a>`;
    el("blog-repo").hidden = false;
  }
  if (meta.demo) {
    el("blog-demo").innerHTML = `open <a href="https://${meta.demo}">${meta.demo}</a>`;
    el("blog-demo").hidden = false;
  }
  if (hero) {
    el("blog-hero").innerHTML = hero;
    el("blog-hero").hidden = false;
  }
  el("blog-body").innerHTML = body;

  printOrder();
};

const slug = slugFromLocation();

/* Bare /blogs/ is not a listing — the deck's #blog screen is the listing,
   and a separate index page was rejected as a hop that buys nothing. */
if (!slug) {
  location.replace("../index.html#blog");
} else {
  try {
    draw(await loadPost(slug));
  } catch (e) {
    fail(location.protocol === "file:"
      ? "A post can't be read straight off disk — the browser blocks " +
        "<code>fetch</code> on <code>file://</code>. Serve the repo " +
        "(<code>bun run dev</code>) and open it over localhost."
      : `${esc(e.message)}. <a href="../index.html#blog">cd ~/blogs</a>.`);
  }
}
