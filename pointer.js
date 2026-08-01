/* pointer.js — the word beside the alien pointer.
 *
 * The cursor sprite (style.css, --ptr-link) says "this is clickable" but
 * can't say where it goes: a cursor image is a data URI outside the
 * cascade, so it carries no text. This parks one lowercase verb beside the
 * block cursor while a link is hovered — open / read / jump / back.
 *
 * Loaded by BOTH page kinds, like theme.js, because the pointer is defined
 * in style.css and every page has links.
 *
 * Fine pointers only. Touch has no cursor to follow, and a label that
 * appeared after a tap would be pure noise.
 */
const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

if (fine.matches) {
  const label = document.createElement("span");
  label.className = "ptrlabel";
  label.setAttribute("aria-hidden", "true");
  document.body.appendChild(label);

  /* The sprite is 40×28 with its hotspot at 4,4 — the block cursor ends
     ~36px right of the pointer, so clear that plus a space. */
  const DX = 42;
  const DY = 6;

  let link = null;
  let x = 0;
  let y = 0;
  let queued = false;

  /* Which verb. Order matters: a post link and the back link are both
     same-origin, so match them before the generic internal case. */
  const verbFor = (a) => {
    const href = a.getAttribute("href") || "";
    if (/[?&]p=/.test(href)) return "read";
    if (href.startsWith("#")) return "jump";
    if (/index\.html#/.test(href)) return "back";
    if (/^(https?:)?\/\//.test(href)) return "open";
    return "jump";
  };

  const place = () => {
    queued = false;
    /* Flip to the pointer's left rather than push the label off-screen. */
    const w = label.offsetWidth;
    const left = x + DX + w > window.innerWidth - 8 ? x - DX - w : x + DX;
    label.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(y + DY)}px, 0)`;
  };

  const move = (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!link || queued) return;
    queued = true;
    requestAnimationFrame(place);
  };

  const hide = () => {
    link = null;
    label.classList.remove("on");
  };

  document.addEventListener("pointerover", (e) => {
    /* Ignore synthesised pointer events from a touch — the sprite isn't
       shown there either. */
    if (e.pointerType && e.pointerType !== "mouse") return hide();
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return hide();
    if (a === link) return;
    link = a;
    label.textContent = verbFor(a);
    x = e.clientX;
    y = e.clientY;
    place();
    label.classList.add("on");
  });

  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerdown", hide);
  /* Leaving the window, or scrolling a link out from under a parked
     pointer, both leave a label with nothing to describe. */
  document.addEventListener("pointerleave", hide);
  window.addEventListener("blur", hide);
  window.addEventListener("scroll", hide, { passive: true, capture: true });
}
