---
title: post title, a lowercase fragment
date: YYYY-MM-DD
desc: one dry sentence — this is the <meta> description and the og: card.
blurb: one dry line — this is the ls entry on the blog screen.
# optional:
# pinned: true                 holds the top of the list whatever its date
# updated: YYYY-MM-DD          only once it differs from `date`
# repo: MKS-01/<repo>          adds the `git clone` line under the meta
# demo: mks-01.github.io/<x>   adds an `open` line under that
---

Copy me: `cp blog/posts/_template.md blog/posts/<slug>.md`, fill it in, then
`python3 tools/build-blog.py`. That writes blog/<slug>.html and rewrites the
post list on the landing page — you do not touch either by hand.

The filename is the slug: lowercase, hyphenated, 23 characters at most. Read
time, the `--i` print order and the paging are all computed; the build fails
if the post runs past 1000 words.

## what you can write

Paragraphs, `## ` and `### ` headings, `- ` lists, `> ` quotes, **bold**,
`inline code`, and [links](https://example.com). Line breaks inside a
paragraph are kept, so wrap the source the way you want the HTML to wrap.

Fenced code blocks, with the two annotations post.css styles — the prompt and
a comment — written as raw spans:

```
<span class="g">$</span> some --command
output line          <span class="c"># a comment</span>
```

## what you write as raw HTML

Anything this markdown subset can't express: a `.hero` figure, or a table
wrapped in `<div class="scroll-x">`. A block that starts with `<` at column 0
passes through untouched until its closing tag, also at column 0.

<div class="scroll-x">
<table>
  <tr><td><code>a</code></td><td>a row</td></tr>
</table>
</div>

An optional hero figure goes **first**, before any prose — it is hoisted out
of the body so it prints as its own step. See `writing-a-blog-post` for the
rules it has to follow; a decorative one will lose.

## don't

No `<style>` here and none in the generated page — `../style.css` carries the
tokens, `post.css` the prose rhythm. If you want CSS, it belongs in
`post.css` so every post gets it.
