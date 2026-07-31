/* ── accent toggle — one source for the deck and every post ──────────
   Loaded from <head> WITHOUT defer on purpose: it stamps the stored theme
   on <html> synchronously, before first paint, so a non-default accent
   doesn't flash amber on every navigation.

   The swatch markup is injected rather than pasted into index.html and
   blogs/index.html — same reasoning as favicon.svg and blog.css: hand-kept
   copies of the same block is how the alien mark drifted. No-JS visitors
   simply get the default theme and no toggle, which is the correct
   degradation for a preference control.

   Token definitions live in style.css under :root[data-theme="…"]. */
(() => {
  const THEMES = [
    { id: "phosphor", label: "phosphor", swatch: "#4f9a60", bg: "#070807" },
    { id: "amber",    label: "amber",    swatch: "#cf7a26", bg: "#080706" },
    { id: "classic",  label: "classic",  swatch: "#6191c9", bg: "#0a0d11" }
  ];
  const DEFAULT = "phosphor";   /* the bare :root block in style.css */
  const KEY = "mks-accent";
  const root = document.documentElement;

  /* localStorage throws outright in some privacy modes, so every touch of
     it is guarded — a blocked preference must not take the page with it */
  const stored = () => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  };
  const known = (id) => THEMES.some((t) => t.id === id);

  /* the default has no data-theme block — leave the attribute off entirely
     for it so :root alone styles the page */
  let current = known(stored()) ? stored() : DEFAULT;
  if (current !== DEFAULT) root.dataset.theme = current;

  /* <meta name="theme-color"> paints the browser chrome on mobile. Unlike
     favicon.svg it CAN follow the toggle — it is a real element, so the same
     switch that swaps the tokens keeps it honest. Its hardcoded value in the
     markup is the default theme's --bg, for the pre-JS frame and for no-JS. */
  const paintChrome = (id) => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const theme = THEMES.find((t) => t.id === id);
    if (meta && theme) meta.setAttribute("content", theme.bg);
  };

  const build = () => {
    const rail = document.querySelector(".rail");
    if (!rail) return;

    const group = document.createElement("div");
    group.className = "swatches";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "accent colour");

    const apply = (id) => {
      current = id;
      if (id === DEFAULT) delete root.dataset.theme;
      else root.dataset.theme = id;
      paintChrome(id);
      try { localStorage.setItem(KEY, id); } catch { /* private mode */ }
      buttons.forEach(({ id: themeId, el }) => {
        el.setAttribute("aria-pressed", String(themeId === id));
      });
    };

    const buttons = THEMES.map((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.title = t.label;
      b.setAttribute("aria-label", t.label);
      b.setAttribute("aria-pressed", String(t.id === current));
      b.style.setProperty("--sw", t.swatch);
      b.appendChild(document.createElement("i"));
      b.addEventListener("click", () => apply(t.id));
      group.appendChild(b);
      return { id: t.id, el: b };
    });

    rail.appendChild(group);
  };

  /* The © year in the tmux bar's right corner. Two lines, and they used to
     sit at the bottom of index.html and of every post — seven copies of the
     same script. Every page already loads this file, so it belongs here for
     the same reason the swatches do. */
  const stampYear = () => {
    const yr = document.getElementById("year");
    if (yr) yr.textContent = new Date().getFullYear();
  };

  const ready = () => {
    build();
    stampYear();
    paintChrome(current);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
