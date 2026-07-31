/* ── accent toggle — one source for the deck and every post ──────────
   Loaded from <head> WITHOUT defer on purpose: it stamps the stored theme
   on <html> synchronously, before first paint, so a non-default accent
   doesn't flash amber on every navigation.

   The swatch markup is injected rather than pasted into index.html and each
   blog/*.html — same reasoning as favicon.svg and post.css: five hand-kept
   copies of the same block is how the alien mark drifted. No-JS visitors
   simply get the default theme and no toggle, which is the correct
   degradation for a preference control.

   Token definitions live in style.css under :root[data-theme="…"]. */
(function () {
  var THEMES = [
    { id: "phosphor", label: "phosphor", swatch: "#4f9a60", bg: "#070807" },
    { id: "amber",    label: "amber",    swatch: "#cf7a26", bg: "#080706" },
    { id: "classic",  label: "classic",  swatch: "#6191c9", bg: "#0a0d11" }
  ];
  var DEFAULT = "phosphor";   /* the bare :root block in style.css */
  var KEY = "mks-accent";
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function known(id) {
    return THEMES.some(function (t) { return t.id === id; });
  }

  /* the default has no data-theme block — leave the attribute off entirely
     for it so :root alone styles the page */
  var current = known(stored()) ? stored() : DEFAULT;
  if (current !== DEFAULT) root.dataset.theme = current;

  /* <meta name="theme-color"> paints the browser chrome on mobile. Unlike
     favicon.svg it CAN follow the toggle — it is a real element, so the same
     switch that swaps the tokens keeps it honest. Its hardcoded value in the
     markup is the default theme's --bg, for the pre-JS frame and for no-JS. */
  function paintChrome(id) {
    var meta = document.querySelector('meta[name="theme-color"]');
    var theme = THEMES.filter(function (t) { return t.id === id; })[0];
    if (meta && theme) meta.setAttribute("content", theme.bg);
  }

  function build() {
    var rail = document.querySelector(".rail");
    if (!rail) return;

    var group = document.createElement("div");
    group.className = "swatches";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "accent colour");

    var buttons = THEMES.map(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.title = t.label;
      b.setAttribute("aria-label", t.label);
      b.setAttribute("aria-pressed", String(t.id === current));
      b.style.setProperty("--sw", t.swatch);
      b.appendChild(document.createElement("i"));
      b.addEventListener("click", function () { apply(t.id); });
      group.appendChild(b);
      return { id: t.id, el: b };
    });

    function apply(id) {
      current = id;
      if (id === DEFAULT) delete root.dataset.theme;
      else root.dataset.theme = id;
      paintChrome(id);
      try { localStorage.setItem(KEY, id); } catch (e) {}
      buttons.forEach(function (b) {
        b.el.setAttribute("aria-pressed", String(b.id === id));
      });
    }

    rail.appendChild(group);
  }

  /* The © year in the tmux bar's right corner. Two lines, and they used to
     sit at the bottom of index.html and of all five posts plus the template —
     seven copies of the same script. Every page already loads this file, so
     it belongs here for the same reason the swatches do. */
  function stampYear() {
    var yr = document.getElementById("year");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  function ready() {
    build();
    stampYear();
    paintChrome(current);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
})();
