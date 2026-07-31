/* ── the blog renderer ────────────────────────────────────────────────
   One page — post.html — serves every post. This reads `?p=<slug>`,
   fetches blog/posts/<slug>.md, and renders it into the page.

   The markdown subset is deliberately small: exactly what these posts use.
   Anything it can't express is written as a raw HTML block in the .md and
   passes through untouched (hero figures, tables). Keep this in step with
   the same subset documented in the `writing-a-blog-post` skill.

   No dependency, and no parser downloaded from anywhere — the whole thing
   is below, and it is the only script a post loads besides theme.js.

   ⚠ fetch() cannot read file:// URLs, so a post opened straight off disk
   shows the "can't load" message. Serve the folder to preview:
       python3 -m http.server   →  localhost:8000/blog/post.html?p=<slug>
   The deployed site is over https, where this is a non-issue. ─────── */
(function () {
  "use strict";

  /* ── inline ──────────────────────────────────────────────────────── */

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(s) {
    var spans = [];
    /* NUL sentinels, not something typeable — a placeholder like " 3 " would
       collide with any prose that happens to contain a bare number */
    s = s.replace(/`([^`]+)`/g, function (_, code) {
      spans.push(esc(code));
      return "\u0000" + (spans.length - 1) + "\u0000";
    });
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*(\S(?:[^*]*\S)?)\*\*/g, "<b>$1</b>");
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return "<code>" + spans[+i] + "</code>";
    });
  }

  /* A fence. Everything is escaped, then the two annotation spans that
     post.css styles (.g the $ prompt, .c a comment) are let back in. */
  function codeBlock(lines) {
    var body = esc(lines.join("\n"));
    body = body.replace(/&lt;span class="([gc])"&gt;/g, '<span class="$1">')
               .replace(/&lt;\/span&gt;/g, "</span>");
    return "<pre><code>" + body + "</code></pre>";
  }

  function isBlockStart(line) {
    return !line.trim() || /^(```|<|## |### |> |- )/.test(line) || /^\d+\. /.test(line);
  }

  /* ── blocks ──────────────────────────────────────────────────────── */

  function renderBody(md) {
    var lines = md.split("\n"), out = [], i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) { i++; continue; }

      if (line.indexOf("```") === 0) {                     /* fenced code */
        i++;
        var code = [];
        while (i < lines.length && lines[i].indexOf("```") !== 0) code.push(lines[i++]);
        i++;
        out.push(codeBlock(code));

      } else if (line.charAt(0) === "<") {                 /* raw HTML block */
        var tag = /^<([a-zA-Z0-9]+)/.exec(line);
        if (!tag) throw new Error("raw HTML block must start with a tag: " + line);
        var close = "</" + tag[1] + ">";
        var raw = [line];
        if (line.indexOf(close) === -1) {
          i++;
          while (i < lines.length && lines[i].indexOf(close) !== 0) raw.push(lines[i++]);
          if (i >= lines.length) throw new Error("raw HTML block never closes: " + close);
          raw.push(lines[i]);
        }
        i++;
        out.push(raw.join("\n"));

      } else if (line.indexOf("## ") === 0 || line.indexOf("### ") === 0) {
        var level = line.indexOf("## ") === 0 ? 2 : 3;
        out.push("<h" + level + ">" + inline(line.slice(level + 1).trim()) + "</h" + level + ">");
        i++;

      } else if (line.indexOf("> ") === 0) {               /* blockquote */
        var quote = [];
        while (i < lines.length && lines[i].indexOf("> ") === 0) quote.push(lines[i++].slice(2).trim());
        out.push("<blockquote><p>" + inline(quote.join(" ")) + "</p></blockquote>");

      } else if (line.indexOf("- ") === 0 || /^\d+\. /.test(line)) {
        var ordered = line.indexOf("- ") !== 0, items = [];
        while (i < lines.length && lines[i].trim()) {
          var cur = lines[i];
          if (cur.indexOf("- ") === 0 || /^\d+\. /.test(cur)) {
            items.push(cur.slice(cur.indexOf(" ") + 1).trim());
          } else if (items.length) {
            items[items.length - 1] += " " + cur.trim();   /* wrapped item */
          } else break;
          i++;
        }
        var t = ordered ? "ol" : "ul";
        out.push("<" + t + ">" + items.map(function (it) {
          return "<li>" + inline(it) + "</li>";
        }).join("") + "</" + t + ">");

      } else {                                             /* paragraph */
        var para = [line];
        i++;
        while (i < lines.length && !isBlockStart(lines[i])) para.push(lines[i++].trim());
        out.push("<p>" + inline(para.join("\n")) + "</p>");
      }
    }
    return out.join("\n");
  }

  /* ── front matter ────────────────────────────────────────────────── */

  function parseFrontMatter(text) {
    if (text.indexOf("---\n") !== 0) throw new Error("no front matter");
    var end = text.indexOf("\n---\n", 3);
    if (end === -1) throw new Error("front matter is never closed");
    var meta = {};
    text.slice(4, end).split("\n").forEach(function (raw) {
      if (!raw.trim() || raw.trim().charAt(0) === "#") return;
      var c = raw.indexOf(":");
      if (c === -1) return;
      meta[raw.slice(0, c).trim()] = raw.slice(c + 1).trim();
    });
    return { meta: meta, body: text.slice(end + 5) };
  }

  /* Prose words — code blocks and the hero don't count toward read time.
     Same formula as tools/build-blog.py, which computes it for the list;
     the two must agree or a post advertises two different lengths. */
  function readTime(bodyHtml) {
    var prose = bodyHtml.replace(/<pre>[\s\S]*?<\/pre>/g, " ").replace(/<[^>]+>/g, " ");
    var words = prose.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  /* ── page ────────────────────────────────────────────────────────── */

  function el(id) { return document.getElementById(id); }

  function fail(message) {
    el("post-title").textContent = "not found";
    el("post-body").innerHTML = "<p>" + message + "</p>";
    document.title = "not found — mks.sh";
    [].forEach.call(document.querySelectorAll(".wrap .in"), function (node, i) {
      node.style.setProperty("--i", i);
    });
    document.body.classList.add("ready");
  }

  /* The slug comes from ?p=, or from a legacy /blog/<slug>.html path that
     404.html hands over — old links stay good. */
  function slugFromLocation() {
    var q = /[?&]p=([A-Za-z0-9-]+)/.exec(location.search);
    if (q) return q[1];
    var path = /\/blog\/([A-Za-z0-9-]+)\.html$/.exec(location.pathname);
    return path && path[1] !== "post" ? path[1] : null;
  }

  function render(slug, text) {
    var parsed = parseFrontMatter(text);
    var meta = parsed.meta;
    var body = renderBody(parsed.body);

    /* a leading hero figure belongs outside .post — its own print step, and
       its labels are not prose, so they don't count toward the read time */
    var hero = "";
    if (/^\s*<figure class="hero"/.test(body)) {
      var cut = body.indexOf("</figure>") + "</figure>".length;
      hero = body.slice(0, cut).replace('<figure class="hero"', '<figure class="hero in"');
      body = body.slice(cut).replace(/^\n+/, "");
    }

    var line = "written " + meta.date;
    if (meta.updated) line += " · updated " + meta.updated;
    line += " · " + readTime(body) + " min";

    document.title = meta.title + " — mks.sh";
    var desc = document.querySelector('meta[name="description"]');
    if (desc && meta.desc) desc.setAttribute("content", meta.desc);

    el("post-cmd").textContent = "less ~/blogs/" + slug + ".md";
    el("post-title").textContent = meta.title;
    el("post-meta").textContent = line;

    if (meta.repo) {
      el("post-repo").innerHTML = 'git clone <a href="https://github.com/' + meta.repo +
        '">github.com/' + meta.repo + "</a>";
      el("post-repo").hidden = false;
    }
    if (meta.demo) {
      el("post-demo").innerHTML = 'open <a href="https://' + meta.demo + '">' + meta.demo + "</a>";
      el("post-demo").hidden = false;
    }
    if (hero) {
      el("post-hero").innerHTML = hero;
      el("post-hero").hidden = false;
    }
    el("post-body").innerHTML = body;

    /* --i is the print order, and the optional lines above shift it, so
       number the visible steps only once we know which of them exist */
    var step = 0;
    [].forEach.call(document.querySelectorAll(".wrap .in"), function (node) {
      if (node.hidden) return;
      node.style.setProperty("--i", step++);
    });
    document.body.classList.add("ready");
  }

  var slug = slugFromLocation();
  if (!slug) {
    fail('No post named. Try <a href="../index.html#blog">cd ~/blogs</a>.');
    return;
  }

  fetch("posts/" + slug + ".md")
    .then(function (r) {
      if (!r.ok) throw new Error("no such post: " + slug);
      return r.text();
    })
    .then(function (text) { render(slug, text); })
    .catch(function (e) {
      fail(location.protocol === "file:"
        ? "A post can't be read straight off disk — the browser blocks " +
          "<code>fetch</code> on <code>file://</code>. Serve the folder " +
          "(<code>python3 -m http.server</code>) and open it over localhost."
        : esc(e.message) + '. <a href="../index.html#blog">cd ~/blogs</a>.');
    });
})();
