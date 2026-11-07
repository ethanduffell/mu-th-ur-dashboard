// MU-TH-UR 6000 sound + effects for the "mu-th-ur" Home Assistant dashboard.
// Audio files are optional: without them you still get the boot animation, grain and glitches, just silent.
// The GLITCHES offsets and LOOP_END below match the ambience file I used; change them to suit your own file.
// On opening MOTHER: plays /config/www/mother-boot.mp3 once, then loops a low drone from
// /config/www/mother-ambience.wav with an occasional quiet glitch, until you leave the dashboard.
// The two header cards glitch in, timed to the boot clip. While MOTHER is open: film grain, vignette, a rolling
// CRT band, random panel glitches, and a full-screen glitch each time a glitch sound plays.
// Volumes are 0.0 to 1.0. GLITCH_EVERY is the random gap between glitches, in seconds.
const MOTHER_PATH = "/mu-th-ur";
const CLIP_URL = "/local/mother-boot.mp3?v=1";
const AMBIENCE_URL = "/local/mother-ambience.wav?v=1";
const VOLUME = 0.8;
const DRONE_VOLUME = 0.141;
const GLITCH_VOLUME = 0.2;
const GLITCH_EVERY = window.__motherGlitchEvery || [45, 120];
const LOOP_END = 330090 / 22050;
const GLITCHES = [[15.0701, 0.45], [15.6201, 0.45], [16.1701, 1.3], [17.5701, 0.45], [18.1201, 0.5]];

if (!window.__motherSoundLoaded) {
  window.__motherSoundLoaded = true;
  let ctx = null, inside = false, waiting = false, drone = null, glitchTimer = null;
  const bufs = {};
  let masterBus = null;
  const master = () => {
    if (!masterBus) { masterBus = ctx.createGain(); masterBus.connect(ctx.destination); }
    return masterBus;
  };
  const onMother = () => location.pathname === MOTHER_PATH || location.pathname.startsWith(MOTHER_PATH + "/");
  const load = async (url) => {
    if (!bufs[url]) {
      bufs[url] = fetch(url).then((r) => { if (!r.ok) throw new Error("missing " + url); return r.arrayBuffer(); })
        .then((a) => ctx.decodeAudioData(a));
      bufs[url].catch(() => { delete bufs[url]; });
    }
    return bufs[url];
  };

  // Boot animation for the two header cards, timed to the 7-second boot clip.
  const BOOT_CARDS = ["# MU-TH-UR", "## [ ATTENTION REQUIRED ]"];
  const findCards = () => {
    const out = [], seen = new Set();
    const walk = (root, depth) => {
      if (!root || depth > 30) return;
      for (const el of root.querySelectorAll("*")) {
        if (el.localName === "hui-markdown-card") {
          const c = (el._config && el._config.content) || "";
          const card = (el.shadowRoot && el.shadowRoot.querySelector("ha-card")) || null;
          if (card && BOOT_CARDS.some((p) => c.startsWith(p)) && !seen.has(el)) { seen.add(el); out.push(card); }
        }
        if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
      }
    };
    walk(document, 0);
    return out;
  };
  const waitForCards = async (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end) { const c = findCards(); if (c.length >= BOOT_CARDS.length) return c; await new Promise((r) => setTimeout(r, 80)); }
    return findCards();
  };
  const D = 7000;
  const k = (t, o) => ({ offset: t / 7, ...o });
  const OFF = { opacity: 0, transform: "none", filter: "brightness(0)", clipPath: "inset(0 0 0 0)" };
  const ON = { opacity: 1, transform: "none", filter: "none", clipPath: "inset(0 0 0 0)" };
  const tear = (x, top, bot, b) => ({ opacity: 1, transform: `translateX(${x}px) skewX(${x / 3}deg)`, filter: `brightness(${b}) contrast(1.4)`, clipPath: `inset(${top}% 0 ${bot}% 0)` });
  const bootFrames = (lag) => {
    const L = (t) => Math.min(7, t + lag);
    return [
      k(0, OFF), k(L(0.25), { ...OFF, opacity: 0.12, filter: "brightness(0.6)" }), k(L(0.32), OFF), k(L(0.55), { ...OFF, opacity: 0.08, filter: "brightness(0.5)" }),
      k(L(0.78), OFF),
      k(L(0.8), { opacity: 1, transform: "scaleY(0.02)", filter: "brightness(3) blur(1px)", clipPath: "inset(0 0 0 0)" }),
      k(L(0.95), { opacity: 1, transform: "scaleY(1)", filter: "brightness(1.8)", clipPath: "inset(0 0 92% 0)" }),
      k(L(1.6), { ...ON, filter: "brightness(1.2)", clipPath: "inset(0 0 65% 0)" }),
      k(L(2.3), { ...ON, filter: "brightness(1.1)", clipPath: "inset(0 0 35% 0)" }),
      k(L(3.2), { ...ON, clipPath: "inset(0 0 0% 0)" }),
      k(L(3.4), tear(-9, 0, 0, 1.8)), k(L(3.48), tear(7, 20, 45, 2.4)), k(L(3.56), { ...ON, opacity: 0.3 }), k(L(3.66), tear(-4, 55, 10, 1.6)),
      k(L(3.78), ON), k(L(3.95), tear(12, 10, 60, 2.2)), k(L(4.05), { ...ON, opacity: 0.5 }), k(L(4.2), tear(-6, 40, 25, 1.7)), k(L(4.5), ON),
      k(L(5.2), tear(8, 0, 70, 2)), k(L(5.3), { ...ON, opacity: 0.25 }), k(L(5.42), tear(-10, 30, 30, 2.6)), k(L(5.55), tear(4, 65, 0, 1.5)), k(L(5.8), ON),
      k(L(6.2), { ...ON, opacity: 0.4, filter: "brightness(1.6)" }), k(L(6.3), ON), k(L(6.45), { ...ON, transform: "translateX(-3px)", filter: "brightness(1.4)" }), k(L(6.6), ON),
      k(7, ON),
    ].sort((a, b) => a.offset - b.offset);
  };
  let hidden = [];
  const preHide = async () => { hidden = await waitForCards(1200); hidden.forEach((el) => { el.style.opacity = "0"; }); setTimeout(unHide, 2500); };
  const unHide = () => { hidden.forEach((el) => { el.style.opacity = ""; }); hidden = []; };
  const animateBoot = async () => {
    const cards = hidden.length ? hidden : await waitForCards(1500);
    cards.forEach((el, i) => {
      el.style.transformOrigin = "50% 50%";
      el.animate(bootFrames(i * 0.15), { duration: D, easing: "linear", fill: "none" });
    });
    unHide();
  };
  const playBoot = async () => {
    try {
      const b = await load(CLIP_URL);
      if (!inside) return;
      const s = ctx.createBufferSource(); s.buffer = b;
      const g = ctx.createGain(); g.gain.value = VOLUME;
      s.connect(g); g.connect(master()); s.start();
      animateBoot();
    } catch (e) { animateBoot(); /* no boot clip: visual boot only */ }
  };
  const scheduleGlitch = () => {
    clearTimeout(glitchTimer);
    const [lo, hi] = GLITCH_EVERY;
    glitchTimer = setTimeout(async () => {
      if (inside && !document.hidden) {
        try {
          const b = await load(AMBIENCE_URL);
          const [off, dur] = GLITCHES[Math.floor(Math.random() * GLITCHES.length)];
          const s = ctx.createBufferSource(); s.buffer = b;
          s.playbackRate.value = 0.85 + Math.random() * 0.3;
          const g = ctx.createGain(), t = ctx.currentTime, v = GLITCH_VOLUME * (0.6 + Math.random() * 0.4);
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.02);
          g.gain.setValueAtTime(v, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
          s.connect(g); g.connect(master()); s.start(t, off, dur);
          screenGlitch(dur / s.playbackRate.value);
        } catch (e) { screenGlitch(0.5); /* no audio file: visual glitch only */ }
      }
      if (inside) scheduleGlitch();
    }, (lo + Math.random() * (hi - lo)) * 1000);
  };
  const startDrone = async () => {
    if (drone) return;
    try {
      const b = await load(AMBIENCE_URL);
      if (!inside || drone) return;
      const s = ctx.createBufferSource(); s.buffer = b;
      s.loop = true; s.loopStart = 0; s.loopEnd = LOOP_END;
      const g = ctx.createGain(), t = ctx.currentTime;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(DRONE_VOLUME, t + 4);
      s.connect(g); g.connect(master()); s.start(t, 0);
      drone = { s, g };
      scheduleGlitch();
    } catch (e) { scheduleGlitch(); /* no ambience file: visual glitches only */ }
  };
  const stopDrone = () => {
    clearTimeout(glitchTimer); glitchTimer = null;
    if (!drone || !ctx) return;
    const { s, g } = drone, t = ctx.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 1);
    s.stop(t + 1.1);
    drone = null;
  };

  // Film grain over the dashboard while MOTHER is open.
  const GRAIN_OPACITY = 0.13;
  let grainEl = null, grainUrl = null;
  const makeGrain = () => {
    const c = document.createElement("canvas"); c.width = c.height = 180;
    const g = c.getContext("2d"), img = g.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v * 0.8; img.data[i + 1] = v; img.data[i + 2] = v * 0.85; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL("image/png");
  };
  const addGrain = () => {
    if (grainEl) return;
    grainUrl = grainUrl || makeGrain();
    grainEl = document.createElement("div");
    grainEl.setAttribute("aria-hidden", "true");
    Object.assign(grainEl.style, {
      position: "fixed", top: "-50%", left: "-50%", width: "200%", height: "200%", pointerEvents: "none", zIndex: "8",
      backgroundImage: `url(${grainUrl})`, backgroundSize: "180px 180px", opacity: String(GRAIN_OPACITY), mixBlendMode: "screen",
    });
    document.body.appendChild(grainEl);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frames = Array.from({ length: 10 }, () => ({
        transform: `translate(${Math.round(Math.random() * 180 - 90)}px, ${Math.round(Math.random() * 180 - 90)}px)`, easing: "steps(1, end)",
      }));
      grainEl.animate(frames, { duration: 900, iterations: Infinity });
    }
  };
  const removeGrain = () => { if (grainEl) { grainEl.remove(); grainEl = null; } };

  // Glitch engine: random panel tears, a rolling CRT band and vignette, and a full-screen
  // glitch whenever a glitch sound plays. PANEL_GLITCH_EVERY is the random gap in seconds.
  const PANEL_GLITCH_EVERY = [2.5, 8];
  const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let fxEls = [], panelTimer = null, cardCache = [], cardCacheAt = 0;
  const allCards = () => {
    if (Date.now() - cardCacheAt < 8000 && cardCache.every((c) => c.isConnected)) return cardCache;
    const out = [];
    const walk = (root, depth) => {
      if (!root || depth > 30) return;
      for (const el of root.querySelectorAll("*")) {
        if (el.localName === "ha-card" && el.getRootNode().host && /card$/.test(el.getRootNode().host.localName)) out.push(el);
        if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
      }
    };
    walk(document, 0);
    cardCache = out; cardCacheAt = Date.now();
    return out;
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const tearFrames = (n, strength) => {
    const f = [{ transform: "none", clipPath: "inset(0 0 0 0)", filter: "none", opacity: 1 }];
    for (let i = 0; i < n; i++) {
      const top = Math.round(rnd(0, 80)), bot = Math.round(rnd(0, 95 - top));
      const x = Math.round(rnd(-1, 1) * strength);
      f.push(Math.random() < 0.25
        ? { transform: "none", clipPath: "inset(0 0 0 0)", filter: `brightness(${rnd(0.2, 0.6).toFixed(2)})`, opacity: rnd(0.3, 0.8) }
        : { transform: `translateX(${x}px) skewX(${(x / 4).toFixed(1)}deg)`, clipPath: `inset(${top}% 0 ${bot}% 0)`,
            filter: `brightness(${rnd(1.3, 2.6).toFixed(2)}) contrast(1.5)`, opacity: 1 });
    }
    f.push({ transform: "none", clipPath: "inset(0 0 0 0)", filter: "none", opacity: 1 });
    return f.map((k) => ({ ...k, easing: "steps(1, end)" }));
  };
  const glitchCard = (el, ms, strength) => {
    if (!el || !el.isConnected || el.getAnimations().length) return;
    el.animate(tearFrames(Math.max(3, Math.round(ms / 45)), strength), { duration: ms });
  };
  const schedulePanelGlitch = () => {
    clearTimeout(panelTimer);
    panelTimer = setTimeout(() => {
      if (inside && !document.hidden && !calm()) {
        const cards = allCards();
        const n = Math.random() < 0.2 ? 2 : 1;
        for (let i = 0; i < n; i++) glitchCard(cards[Math.floor(Math.random() * cards.length)], rnd(140, 420), rnd(4, 14));
      }
      if (inside) schedulePanelGlitch();
    }, rnd(...PANEL_GLITCH_EVERY) * 1000);
  };
  const screenGlitch = (dur) => {
    if (calm()) return;
    const ms = Math.max(250, dur * 1000);
    allCards().forEach((el) => glitchCard(el, ms * rnd(0.6, 1), rnd(8, 22)));
    const bars = document.createElement("div");
    Object.assign(bars.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "9", mixBlendMode: "screen", opacity: "0" });
    const tops = Array.from({ length: 6 }, () => Math.round(rnd(0, 92))).sort((a, b) => a - b);
    const stops = ["transparent 0%"];
    let last = 0;
    tops.forEach((t) => {
      const s0 = Math.max(t, last), s1 = s0 + Math.round(rnd(1, 4)), a = rnd(0.06, 0.24).toFixed(2);
      stops.push(`transparent ${s0}%`, `rgba(57,240,60,${a}) ${s0}%`, `rgba(57,240,60,${a}) ${s1}%`, `transparent ${s1}%`);
      last = s1;
    });
    stops.push("transparent 100%");
    bars.style.background = `linear-gradient(180deg, ${stops.join(", ")})`;
    document.body.appendChild(bars);
    const a = bars.animate(Array.from({ length: Math.round(ms / 50) }, () => ({ opacity: Math.random() < 0.5 ? 1 : 0, transform: `translateY(${Math.round(rnd(-30, 30))}px)`, easing: "steps(1, end)" })), { duration: ms });
    a.onfinish = () => bars.remove();
  };
  const addFx = () => {
    if (fxEls.length) return;
    const vig = document.createElement("div");
    Object.assign(vig.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "8",
      background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" });
    const band = document.createElement("div");
    Object.assign(band.style, { position: "fixed", left: "0", right: "0", top: "0", height: "22vh", pointerEvents: "none", zIndex: "8",
      background: "linear-gradient(180deg, transparent, rgba(57,240,60,0.05) 45%, rgba(57,240,60,0.08) 50%, rgba(57,240,60,0.05) 55%, transparent)" });
    [vig, band].forEach((e) => { e.setAttribute("aria-hidden", "true"); document.body.appendChild(e); });
    if (!calm()) band.animate([{ transform: "translateY(-25vh)" }, { transform: "translateY(105vh)" }], { duration: 7500, iterations: Infinity });
    fxEls = [vig, band];
    schedulePanelGlitch();
  };
  const removeFx = () => { clearTimeout(panelTimer); fxEls.forEach((e) => e.remove()); fxEls = []; };

  // Hooks for recording and demos: window.__motherFx.reboot(), .glitch(), .audioStream()
  const fireGlitch = async () => {
    if (!ctx || !drone) return;
    const b = await load(AMBIENCE_URL);
    const [off, dur] = GLITCHES[Math.floor(Math.random() * GLITCHES.length)];
    const s = ctx.createBufferSource(); s.buffer = b;
    const g = ctx.createGain(), t = ctx.currentTime, v = GLITCH_VOLUME;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.02);
    g.gain.setValueAtTime(v, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
    s.connect(g); g.connect(master()); s.start(t, off, dur);
    screenGlitch(dur);
  };
  window.__motherFx = {
    reboot: () => { if (ctx && inside) playBoot(); },
    glitch: () => fireGlitch(),
    audioStream: () => { if (!ctx) return null; const d = ctx.createMediaStreamDestination(); master().connect(d); return d.stream; },
  };
  const go = () => { playBoot(); startDrone(); };
  const waitForClick = () => {
    if (waiting) return; waiting = true;
    const evs = ["pointerdown", "keydown", "touchstart"];
    const h = () => {
      evs.forEach((e) => window.removeEventListener(e, h, true));
      waiting = false;
      if (onMother()) ctx.resume().then(go);
    };
    evs.forEach((e) => window.addEventListener(e, h, true));
  };
  const play = () => {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "running") { preHide(); return go(); }
      ctx.resume().catch(() => {});
      setTimeout(() => (ctx.state === "running" ? (preHide(), go()) : waitForClick()), 150);
    } catch (e) { /* audio unavailable: stay silent */ }
  };
  const check = () => {
    const now = onMother();
    if (now && !inside) { inside = true; addGrain(); addFx(); play(); }
    else if (!now && inside) { inside = false; removeGrain(); removeFx(); stopDrone(); }
  };
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (inside) ctx.resume().catch(() => {});
  });
  window.addEventListener("location-changed", () => setTimeout(check, 0));
  window.addEventListener("popstate", check);
  setInterval(check, 500);
  check();
}
