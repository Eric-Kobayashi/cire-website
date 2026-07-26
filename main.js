(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
  const parallax = Array.from(document.querySelectorAll("[data-parallax]"));
  // Figures compete for focus too, so text recedes while an image holds the stage.
  const beats = Array.from(document.querySelectorAll(".beat, .media"));
  const hero = document.querySelector("[data-hero]");
  const nav = document.querySelector(".site-nav");
  const progress = document.querySelector(".scroll-progress span");
  const railLinks = Array.from(document.querySelectorAll("[data-rail]"));
  const sections = railLinks
    .map((a) => document.getElementById(a.dataset.rail))
    .filter(Boolean);

  document.documentElement.classList.add(reduced ? "no-motion" : "js-motion");

  if (reduced) return;

  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const smooth = (t) => t * t * (3 - 2 * t);

  // Big statements light up word by word as they cross the viewport.
  for (const el of document.querySelectorAll(
    ".line.statement, .line.punch, .line.tagline"
  )) {
    if (el.children.length) continue;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    el.classList.add("split");
    const last = Math.max(words.length - 1, 1);
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.style.setProperty("--wi", i);
      span.style.setProperty("--wn", last);
      span.textContent = w;
      el.append(span, document.createTextNode(" "));
    });
  }

  let ticking = false;

  function frame() {
    ticking = false;
    const vh = window.innerHeight;

    for (const el of reveals) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.6) continue;
      // brightens across a wide band: begins at the viewport edge, settled by 58%
      const enter = ease(clamp((vh * 1.02 - r.top) / (vh * 0.44)));
      // recedes only after it has nearly left the top
      const leave = ease(clamp((vh * 0.12 - r.bottom) / (vh * 0.25)));
      el.style.setProperty("--enter", enter.toFixed(3));
      el.style.setProperty("--leave", leave.toFixed(3));
    }

    // One block at a time holds focus: whichever fills the reading band most.
    const bandTop = vh * 0.26;
    const bandBottom = vh * 0.74;
    let best = 0;
    const scores = beats.map((el) => {
      const r = el.getBoundingClientRect();
      const s = Math.max(
        0,
        Math.min(r.bottom, bandBottom) - Math.max(r.top, bandTop)
      );
      if (s > best) best = s;
      return s;
    });
    beats.forEach((el, i) => {
      const share = best > 0 ? scores[i] / best : 0;
      el.style.setProperty(
        "--bf",
        smooth(clamp((share - 0.5) / 0.45)).toFixed(3)
      );
    });

    for (const s of sections) {
      const r = s.getBoundingClientRect();
      const p = clamp((vh * 0.62 - r.top) / r.height);
      s.style.setProperty("--sp", p.toFixed(3));
    }

    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const mid = (r.top + r.height / 2) / vh; // 0 top .. 1 bottom
      el.style.setProperty("--shift", (mid - 0.5).toFixed(3));
    }

    if (hero) {
      const p = clamp(window.scrollY / (vh * 0.85));
      hero.style.setProperty("--out", p.toFixed(3));
    }

    nav?.classList.toggle("is-solid", window.scrollY > 40);

    if (progress) {
      const max = document.documentElement.scrollHeight - vh;
      progress.style.transform = `scaleX(${max > 0 ? clamp(window.scrollY / max) : 0})`;
    }

    if (sections.length) {
      let active = -1;
      sections.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        if (r.top <= vh * 0.5 && r.bottom >= vh * 0.5) active = i;
      });
      railLinks.forEach((a, i) => a.classList.toggle("is-active", i === active));
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  frame();
})();
