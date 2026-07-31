/* ── the JS gate ──────────────────────────────────────────────────────
   bun run check   →   parses every script the site ships.

   There is no ESLint here on purpose: adding it would mean a lockfile and
   a node_modules for a repo whose whole point is that it clones and runs.
   Bun's own transpiler catches what actually breaks a page — a syntax
   error in a file the browser loads with no build step to fail first.

   The style rules that a linter would enforce are instead settled in the
   source: every script is const/let, arrow callbacks and template literals.
   Keep new code in that voice.
   ─────────────────────────────────────────────────────────────────── */
import { file } from "bun";

const FILES = ["theme.js", "deck.js", "blogs/markdown.js", "blogs/render.js",
               "tools/dev.js", "tools/check-js.js", "tools/check-posts.js"];
const ROOT = new URL("..", import.meta.url).pathname;
const transpiler = new Bun.Transpiler({ loader: "js" });

let failed = 0;

for (const name of FILES) {
  const source = await file(ROOT + name).text();
  try {
    transpiler.scan(source);
    console.log(`  ok    ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL  ${name} — ${error.message}`);
  }
}

console.log(failed ? `\n${failed} problem(s)` : "\nall scripts parse");
process.exit(failed ? 1 : 0);
