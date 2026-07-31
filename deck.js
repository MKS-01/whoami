/* ── deck-only behaviour ──────────────────────────────────────────────
   Linked by index.html only. Loaded at the end of <body>, without `defer`,
   because it reads layout and expects the deck's markup to already exist —
   keep it in that position if you move the tag.

   theme.js (the accent toggle, the © year) is separate and loads in <head>
   on every page, posts included. Nothing here is shared with a post.

   Was an inline <script> in index.html; see deck.css for why it moved. ─ */
  /* ── horizontal tracks ──────────────────────────────────────────────
     Two screens page their content sideways so the deck stays at three
     scrolls: #projects (three man pages) and #blog (the post list, three
     per page). One factory drives both — they differ only in whether the
     live item names the mac's app.

     The rule the whole thing is built around: never slide text out from
     under someone reading it. Hover, focus, touch or a manual scroll holds
     the track; it only resumes after a quiet spell, and
     prefers-reduced-motion turns auto-advance off entirely (the track
     stays swipeable). */
  const mac = document.querySelector(".mac");
  /* Single door for changing the mac's app, so the pixel wipe fires no
     matter who asks — the screen observer or the projects track. Skips the
     wipe when the app hasn't actually changed (the observer re-fires on
     every crossing) and on the very first set, which is page load. */
  let macBooted = false;
  const setApp = (id) => {
    if (!mac || !id || mac.dataset.app === id) return;
    mac.dataset.app = id;
    if (!macBooted) { macBooted = true; return; }
    mac.classList.remove("swap");
    void mac.offsetWidth;      /* reflow, or re-adding the class is a no-op */
    mac.classList.add("swap");
  };
  /* `namesApp: true` means the live item IS what the mac should show
     (#projects has no app of its own — the live card names it). #blog
     keeps its own app, so its track just pages the list. */
  const makeTrack = (id, namesApp) => {
    const track = document.getElementById(id);
    if (!track) return null;
    const items = [...track.children];
    if (!items.length) return null;

    /* scope the indicator to this track's own screen — with two tbars on
       the page a bare document.querySelector(".tbar") grabs the wrong one */
    const scope = track.closest(".screen") || document;
    const tbar = scope.querySelector(".tbar");
    const segs = tbar ? [...tbar.querySelectorAll(".segs i")] : [];
    const count = tbar ? tbar.querySelector(".tcount") : null;
    const pane = document.querySelector('.rail .pane[data-track="' + id + '"]');
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const DWELL = 7000;    /* time on each item — matches --dwell in the CSS */
    const IDLE = 10000;    /* quiet time before auto-advance comes back */
    let idx = 0, tick = null, idleTimer = null, held = false, onScreen = false;

    const paint = () => {
      items.forEach((c, i) => c.classList.toggle("live", i === idx));
      segs.forEach((s, i) => {
        /* restart the countdown fill: re-adding the class isn't enough,
           the animation has to be taken off the element and put back */
        s.classList.remove("on", "done");
        void s.offsetWidth;
        s.classList.toggle("on", i === idx);
        s.classList.toggle("done", i < idx);
      });
      if (count) count.textContent = (idx + 1) + "/" + items.length;
      if (pane) pane.textContent = "." + (idx + 1);
      if (onScreen && namesApp) setApp(items[idx].id);
    };

    const go = (i, smooth) => {
      idx = (i + items.length) % items.length;
      track.scrollTo({
        left: idx * track.clientWidth,
        behavior: smooth && !still.matches ? "smooth" : "auto"
      });
      paint();
    };

    /* Two independent states, and keeping them apart matters:
         .running — auto mode is on at all (this screen is in view and
                    motion is allowed). Drives whether the countdown fill
                    exists.
         .paused  — someone is engaged right now. Freezes that fill.
       Folding them together made a hover *remove* the countdown instead of
       stopping it, so the bar jumped to full — the opposite of "paused". */
    const stop = () => { clearInterval(tick); tick = null; };
    const start = () => {
      stop();
      if (held || still.matches || !onScreen) return;
      tick = setInterval(() => go(idx + 1, true), DWELL);
    };
    const hold = () => {
      held = true;
      if (tbar) tbar.classList.add("paused");
      clearTimeout(idleTimer);
      stop();
    };
    const release = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        held = false;
        if (tbar) tbar.classList.remove("paused");
        start();
      }, IDLE);
    };

    track.addEventListener("mouseenter", hold);
    track.addEventListener("mouseleave", release);
    track.addEventListener("focusin", hold);
    track.addEventListener("focusout", release);
    ["pointerdown", "touchstart", "wheel"].forEach((ev) =>
      track.addEventListener(ev, () => { hold(); release(); }, { passive: true }));

    /* manual scroll (swipe, trackpad, or our own scrollTo) — resync the
       indicator to wherever the track actually landed */
    let settle;
    track.addEventListener("scroll", () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== idx && items[i]) { idx = i; paint(); }
      }, 120);
    }, { passive: true });

    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { hold(); release(); go(idx + 1, true); }
      if (e.key === "ArrowLeft")  { hold(); release(); go(idx - 1, true); }
    });

    paint();
    return {
      /* only runs while its own screen is in view — an invisible carousel
         burning through its items helps nobody */
      screen(active) {
        onScreen = active;
        if (tbar) tbar.classList.toggle("running", active && !still.matches);
        if (active) { paint(); start(); }
        else {
          /* leaving the screen clears the held state too — otherwise a
             hover on the way past would freeze it for the next visit */
          stop();
          clearTimeout(idleTimer);
          held = false;
          if (tbar) tbar.classList.remove("paused");
        }
      },
      to(childId) {
        const i = items.findIndex((c) => c.id === childId);
        if (i > -1) go(i, false);
      },
      liveId() { return namesApp ? items[idx].id : null; }
    };
  };

  /* keyed by the screen id each track lives on */
  const tracks = {
    projects: makeTrack("mantrack", true),
    blog: makeTrack("blogtrack", false)
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      }
    }, { threshold: 0.4 });
    document.querySelectorAll(".reveal").forEach((s) => io.observe(s));

    const rail = [...document.querySelectorAll(".rail a")];
    const screens = [...document.querySelectorAll(".screen")];
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const i = screens.indexOf(e.target);
          rail.forEach((d, j) => d.classList.toggle("active", j === i));
          /* #projects has no app of its own — the live card names it. */
          const here = tracks[e.target.id];
          setApp((here && here.liveId()) || e.target.id);
          /* the mac slides to the left half on the projects screen */
          if (mac) mac.classList.toggle("flip", e.target.id === "projects");
          /* a track auto-advances only while its own screen is in view */
          for (const key in tracks) {
            if (tracks[key]) tracks[key].screen(key === e.target.id);
          }
        }
      }
      /* center-line detector: fires when a screen crosses the viewport's
         vertical middle, regardless of its height. A plain area threshold
         (e.g. 0.6) silently skips on mobile, where detail screens run
         taller than the viewport thanks to the mac's reserved padding. */
    }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    screens.forEach((s) => spy.observe(s));

  } else {
    document.querySelectorAll(".reveal").forEach((s) => s.classList.add("on"));
  }

  /* In-page anchor nav (tmux bar + landing links). iOS Safari mis-handles
     hash jumps under `scroll-snap-type: mandatory` — it lands on the wrong
     screen or snaps back. Drive the scroll ourselves with snap momentarily
     off, then restore it. */
  const root = document.documentElement;
  let snapTimer;
  const restoreSnap = () => {
    clearTimeout(snapTimer);
    root.style.scrollSnapType = "";
    window.removeEventListener("scrollend", restoreSnap);
  };
  const goTo = (target, smooth) => {
    clearTimeout(snapTimer);
    root.style.scrollSnapType = "none";
    target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    // re-arm snap when the scroll settles — scrollend fires at the true
    // end regardless of distance (iOS 16.4+); timeout covers older Safari
    // and the case where the page was already at the target (no scroll).
    window.addEventListener("scrollend", restoreSnap, { once: true });
    snapTimer = setTimeout(restoreSnap, 1200);
  };
  /* The landing's `ls ~/weekend-hacks` list still links #readback, #pizow
     and #mac-mlx-cluster, but those are now cards inside #projects rather
     than screens of their own. Resolve a card hash to its screen and slide
     the track to it, so the old links keep meaning what they said. */
  const resolve = (hash) => {
    const el = document.getElementById(hash);
    if (!el) return null;
    const card = el.closest(".card");
    return { screen: card ? el.closest(".screen") : el, card: card ? hash : null };
  };
  const jump = (hash, smooth) => {
    const hit = resolve(hash);
    if (!hit) return false;
    if (hit.card && tracks.projects) tracks.projects.to(hit.card);
    goTo(hit.screen, smooth);
    return true;
  };
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!jump(href.slice(1), true)) return;
      e.preventDefault();
      history.replaceState(null, "", href);
    });
  });

  /* Landing on a deep link (e.g. back from a post to #blog): the browser's
     own hash scroll is unreliable under mandatory snap on iOS, same as the
     click case. Redo it ourselves once layout has settled. */
  if (location.hash.length > 1) {
    const hash = location.hash.slice(1);
    requestAnimationFrame(() => jump(hash, false));
  }
