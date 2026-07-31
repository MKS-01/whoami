/* ── dev server ───────────────────────────────────────────────────────
   bun run dev   →   http://localhost:3000

   A post is fetched at run time (blog/post.html reads ?p=<slug> and pulls
   blog/posts/<slug>.md), and `fetch` is blocked on file:// — so a post
   simply cannot be opened off disk. This exists so you don't have to
   remember that.

   It deliberately imitates two GitHub Pages behaviours, so what you see
   here is what deploys:
     · a directory serves its index.html
     · an unknown path serves 404.html, with a 404 status — which is what
       makes the legacy /blog/<slug>.html redirect testable locally
   ─────────────────────────────────────────────────────────────────── */
import { file } from "bun";

const ROOT = new URL("..", import.meta.url).pathname;
const PORT = Number(Bun.env.PORT ?? 3000);

const serve = async (path) => {
  const f = file(ROOT + path.replace(/^\/+/, ""));
  return (await f.exists()) ? f : null;
};

Bun.serve({
  port: PORT,
  async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path.endsWith("/")) path += "index.html";

    const hit = (await serve(path)) ?? (await serve(`${path}/index.html`));
    if (hit) return new Response(hit);

    const notFound = await serve("404.html");
    return notFound
      ? new Response(notFound, { status: 404 })
      : new Response("404", { status: 404 });
  },
});

console.log(`mks.sh → http://localhost:${PORT}`);
console.log(`  a post → http://localhost:${PORT}/blog/post.html?p=the-nas-rebuilt`);
