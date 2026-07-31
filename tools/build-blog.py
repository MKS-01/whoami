#!/usr/bin/env python3
"""Write the landing page's post list from the posts' front matter.

    python3 tools/build-blog.py           # rewrite the #blog list in index.html
    python3 tools/build-blog.py --check   # verify it is current, write nothing

Posts themselves are NOT generated: blog/post.html renders any post in the
browser from blog/posts/<slug>.md. What can't be done in the browser is the
list on the landing page — nothing can enumerate a directory over http — so
the slugs, titles, dates and read-times are baked into index.html here,
between the BUILD: marker comments.

It also validates what the browser has no good way to complain about: the
1000-word ceiling, the 23-char slug, the ~10-post cap.

Read time must match what blog/render.js computes at run time (same formula,
same exclusions) or a post advertises one length on the list and another on
the page. If you change one, change the other.

Python 3 standard library only. Adding a dependency here would be the first
one in the repo.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "blog" / "posts"
INDEX = ROOT / "index.html"

# the owner's rules, enforced rather than just documented
MAX_POSTS = 10          # "cap ~10"
MAX_SLUG = 23           # longer wraps the .name column on the blog screen
MAX_WORDS = 1000        # the 5-minute hard ceiling
PER_PAGE = 3            # posts per .bpage

class PostError(Exception):
    """A problem with one post, reported with its file name."""


# ── markdown ────────────────────────────────────────────────────────────────
# A deliberately small subset: exactly what the posts use. Anything this can't
# express is written as a raw HTML block instead (see render_body).

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def inline(s):
    """`code`, **bold**, [text](url) — everything else is escaped text."""
    spans = []

    def stash(m):
        spans.append(esc(m.group(1)))
        return "\x00%d\x00" % (len(spans) - 1)

    s = re.sub(r"`([^`]+)`", stash, s)
    s = esc(s)
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', s)
    s = re.sub(r"\*\*(\S(?:[^*]*\S)?)\*\*", r"<b>\1</b>", s)
    return re.sub(r"\x00(\d+)\x00",
                  lambda m: "<code>%s</code>" % spans[int(m.group(1))], s)


def code_block(lines):
    """A fence. Everything is escaped, then the two annotation spans that
    post.css styles (`.g` the $ prompt, `.c` a comment) are let back in."""
    body = esc("\n".join(lines))
    for cls in ("g", "c"):
        body = body.replace('&lt;span class="%s"&gt;' % cls,
                            '<span class="%s">' % cls)
    return "    <pre><code>%s</code></pre>" % body.replace("&lt;/span&gt;", "</span>")


def is_block_start(line):
    return (not line.strip()
            or line.startswith(("```", "<", "## ", "### ", "> ", "- "))
            or re.match(r"\d+\. ", line))


def render_body(md):
    """markdown → the inside of <div class="post">, indented four spaces."""
    lines = md.split("\n")
    out, i = [], 0

    while i < len(lines):
        line = lines[i]

        if not line.strip():
            i += 1
            continue

        # fenced code
        if line.startswith("```"):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            if i >= len(lines):
                raise PostError("unclosed ``` fence")
            i += 1
            out.append(code_block(buf))

        # raw HTML block — passed through verbatim. This is how hero figures,
        # inline SVG and tables (which markdown can't express in this site's
        # markup) stay possible. Opens at column 0, closes with its own
        # closing tag at column 0.
        elif line.startswith("<"):
            m = re.match(r"<([a-zA-Z0-9]+)", line)
            if not m:
                raise PostError("raw HTML block must start with a tag: %r" % line)
            close = "</%s>" % m.group(1)
            buf = [line]
            if close not in line:
                i += 1
                while i < len(lines) and not lines[i].startswith(close):
                    buf.append(lines[i])
                    i += 1
                if i >= len(lines):
                    raise PostError("raw HTML block never closes: %s" % close)
                buf.append(lines[i])
            i += 1
            out.append("\n".join(("    " + b) if b.strip() else "" for b in buf))

        # headings
        elif line.startswith("## ") or line.startswith("### "):
            level = 2 if line.startswith("## ") else 3
            text = line.split(" ", 1)[1].strip()
            out.append("    <h%d>%s</h%d>" % (level, inline(text), level))
            i += 1

        # blockquote
        elif line.startswith("> "):
            buf = []
            while i < len(lines) and lines[i].startswith("> "):
                buf.append(lines[i][2:].strip())
                i += 1
            out.append("    <blockquote><p>%s</p></blockquote>" % inline(" ".join(buf)))

        # list
        elif line.startswith("- ") or re.match(r"\d+\. ", line):
            ordered = not line.startswith("- ")
            items = []
            while i < len(lines) and lines[i].strip():
                cur = lines[i]
                if cur.startswith("- ") or re.match(r"\d+\. ", cur):
                    items.append(cur.split(" ", 1)[1].strip())
                elif items:
                    items[-1] += " " + cur.strip()       # wrapped item
                else:
                    break
                i += 1
            tag = "ol" if ordered else "ul"
            out.append("    <%s>\n%s\n    </%s>" % (
                tag,
                "\n".join("      <li>%s</li>" % inline(it) for it in items),
                tag))

        # paragraph — the author's line breaks are kept, so the generated
        # HTML wraps the way the markdown does
        else:
            buf = [line]
            i += 1
            while i < len(lines) and not is_block_start(lines[i]):
                buf.append(lines[i].strip())
                i += 1
            text = inline("\n".join(buf))
            out.append("    <p>%s</p>" % text.replace("\n", "\n    "))

    return "\n\n".join(out)


# ── posts ───────────────────────────────────────────────────────────────────

def parse_front_matter(text, name):
    if not text.startswith("---\n"):
        raise PostError("%s: must open with a --- front matter block" % name)
    end = text.find("\n---\n", 3)
    if end == -1:
        raise PostError("%s: front matter is never closed" % name)
    meta = {}
    for raw in text[4:end].split("\n"):
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if ":" not in raw:
            raise PostError("%s: front matter line is not `key: value`: %r" % (name, raw))
        k, v = raw.split(":", 1)
        meta[k.strip()] = v.strip()
    return meta, text[end + 5:]


def word_count(body_html):
    """Prose words — code blocks don't count toward the read time."""
    prose = re.sub(r"<pre>[\s\S]*?</pre>", " ", body_html)
    return len(re.sub(r"<[^>]+>", " ", prose).split())


def load_posts():
    posts = []
    for path in sorted(POSTS_DIR.glob("*.md")):
        if path.name.startswith("_"):
            continue                                    # _template.md
        slug = path.stem
        meta, md = parse_front_matter(path.read_text(), path.name)

        for key in ("title", "date", "desc", "blurb"):
            if not meta.get(key):
                raise PostError("%s: front matter is missing `%s`" % (path.name, key))
        if len(slug) > MAX_SLUG:
            raise PostError("%s: slug is %d chars, max is %d — longer ones wrap "
                            "the name column" % (path.name, len(slug), MAX_SLUG))
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", meta["date"]):
            raise PostError("%s: date must be YYYY-MM-DD" % path.name)

        body = render_body(md)
        if body.lstrip().startswith('<figure class="hero"'):
            # render.js hoists a leading hero out of .post; its labels are not
            # prose, so drop it before counting or the read time disagrees
            body = body.partition("</figure>")[2].lstrip("\n")

        words = word_count(body)
        if words > MAX_WORDS:
            raise PostError("%s: %d words, the hard ceiling is %d (5 min). Cut "
                            "it or split it into two posts."
                            % (path.name, words, MAX_WORDS))
        posts.append({
            "slug": slug,
            "meta": meta,
            "body": body,
            "words": words,
            "minutes": max(1, round(words / 200)),
            "pinned": meta.get("pinned", "").lower() in ("true", "yes", "1"),
        })

    if len(posts) > MAX_POSTS:
        raise PostError("%d posts, the cap is %d — removing the oldest is part "
                        "of adding a new one" % (len(posts), MAX_POSTS))

    # pinned first, then newest first — the shipped order. The pin is why the
    # list is not purely date-sorted; both sorts are stable, so it holds.
    posts.sort(key=lambda p: p["meta"]["date"], reverse=True)
    posts.sort(key=lambda p: not p["pinned"])
    return posts


# ── the #blog list in index.html ────────────────────────────────────────────

def render_list(posts):
    pages, out = [posts[k:k + PER_PAGE] for k in range(0, len(posts), PER_PAGE)], []
    n = 1
    for page in pages:
        rows = []
        for post in page:
            m = post["meta"]
            pin = ('pinned <span class="sep">·</span> ' if post["pinned"] else "")
            rows.append(
                '          <li class="in" style="--i:%d">\n'
                '            <a href="blog/post.html?p=%s">\n'
                '              <span class="name">%s</span>\n'
                '              <p class="desc">%s<span class="meta">%s%s '
                '<span class="sep">·</span> %d min</span></p>\n'
                '            </a>\n'
                '          </li>' % (n, post["slug"], post["slug"],
                                     inline(m["blurb"]), pin, m["date"], post["minutes"]))
            n += 1
        out.append('        <div class="bpage">\n'
                   '        <ul class="output projects">\n'
                   + "\n".join(rows)
                   + '\n        </ul>\n        </div>')
    return "\n".join(out), len(pages)


def render_tbar(pages):
    return ('        <span class="segs" aria-hidden="true">%s</span>\n'
            '        <span class="tcount" aria-live="polite">1/%d</span>'
            % ("<i><b></b></i>" * pages, pages))


def splice(text, name, replacement):
    start = "<!-- BUILD:%s start" % name
    end = "<!-- BUILD:%s end -->" % name
    a, b = text.find(start), text.find(end)
    if a == -1 or b == -1:
        raise PostError("index.html is missing the BUILD:%s markers" % name)
    a = text.index("\n", text.index("-->", a)) + 1   # past the whole start comment
    b = text.rfind("\n", 0, b) + 1           # keep the end marker's indentation
    return text[:a] + replacement + "\n" + text[b:]


def render_index(posts, current):
    body, pages = render_list(posts)
    out = splice(current, "blog-list", body)
    return splice(out, "blog-tbar", render_tbar(pages))


# ── driver ──────────────────────────────────────────────────────────────────

def build():
    posts = load_posts()
    return posts, {INDEX: render_index(posts, INDEX.read_text())}


def main():
    check = "--check" in sys.argv[1:]
    try:
        posts, files = build()
    except PostError as e:
        print("build-blog: %s" % e, file=sys.stderr)
        return 1

    drift = [p for p, text in files.items()
             if not p.exists() or p.read_text() != text]

    if check:
        for p in drift:
            print("build-blog: %s post list is out of date — run "
                  "tools/build-blog.py" % p.relative_to(ROOT), file=sys.stderr)
        if not drift:
            print("build-blog: %d posts, list up to date" % len(posts))
        return 1 if drift else 0

    for path, text in files.items():
        if not path.exists() or path.read_text() != text:
            path.write_text(text)
            print("wrote %s" % path.relative_to(ROOT))

    for p in posts:
        print("  %-24s %4d words · %d min%s"
              % (p["slug"], p["words"], p["minutes"], "  (pinned)" if p["pinned"] else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
