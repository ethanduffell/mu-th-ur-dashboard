// HACS distribution entry point for the MOTHER motion tracker card.
// Audited from upstream commit e2837327a1c324ee2b21b008a123a98178efbfe2.
// This bundle intentionally excludes the optional sound/effects module.
// MOTHER motion tracker card: a green radar-style scanner for the MU-TH-UR dashboard.
// Shows contacts when the configured detection sensors are on. Tap opens the live camera.
// Options: entity (person detection), motion (optional extra sensor), camera, range (metres), title.
const C = { bg: "#0e100e", dim: "#123a14", line: "#2bc42e", mid: "#26a82a", fg: "#39f03c", hi: "#8dff8d", core: "#eaffea" };
const FONT = "'Courier Prime', monospace";
const PERIOD = 1.8;

class MotherTrackerCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error("Set an entity (the person detection sensor)");
    this._cfg = { range: 20, title: "[ SCANNER // GARDEN ]", ...config };
    this._targets = [];
    this._kind = null;
    if (!this.shadowRoot) this._build();
    this.shadowRoot.querySelector(".title").textContent = this._cfg.title;
  }
  static getStubConfig() { return { entity: "binary_sensor.garden_person_detection" }; }
  getCardSize() { return 7; }
  getGridOptions() { return { columns: 12, rows: 6, min_rows: 5 }; }

  _build() {
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      ha-card{background:${C.bg};border:3px solid ${C.line};border-radius:0;box-shadow:0 0 14px rgba(57,240,60,.18),inset 0 0 40px rgba(57,240,60,.06);
        color:${C.fg};font-family:'Courier Prime',monospace;letter-spacing:0;text-shadow:0 0 5px rgba(57,240,60,.5);position:relative;overflow:hidden;height:100%;
        display:flex;flex-direction:column;padding:10px 12px;box-sizing:border-box;cursor:pointer}
      ha-card::after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.38) 0 2px,transparent 2px 4px)}
      .title{color:${C.hi};font-size:20px;font-weight:700;letter-spacing:1px;padding-bottom:4px;margin-bottom:6px;border-bottom:1px solid ${C.line}}
      .wrap{flex:1;min-height:200px;position:relative;margin:0 -12px -10px}
      canvas{position:absolute;inset:0;width:100%;height:100%}
    </style><ha-card><div class="title"></div><div class="wrap"><canvas></canvas></div></ha-card>`;
    this._canvas = root.querySelector("canvas");
    root.querySelector("ha-card").addEventListener("click", () => {
      const id = this._cfg.camera || this._cfg.entity;
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    });
  }

  set hass(hass) {
    this._hass = hass;
    const st = (e) => (e && hass.states[e] ? hass.states[e].state : null);
    const person = st(this._cfg.entity) === "on";
    const motion = st(this._cfg.motion) === "on";
    this._offline = st(this._cfg.entity) === "unavailable";
    const kind = person ? "LIFEFORM" : motion ? "MOVEMENT" : null;
    if (kind && !this._targets.some((t) => !t.lost)) this._spawn();
    if (!kind) this._targets.forEach((t) => { if (!t.lost) t.lost = performance.now(); });
    this._kind = kind;
  }

  _spawn() {
    const a = 25 + Math.random() * 130;
    this._targets.push({ a, d: 0.62 + Math.random() * 0.3, va: (Math.random() - 0.5) * 3, flash: 0, lastPulse: -1, lost: 0,
      seed: Math.random() * 10 });
  }

  connectedCallback() {
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this._canvas.parentElement);
    this._resize();
    const loop = (t) => { this._raf = requestAnimationFrame(loop); this._draw(t / 1000); };
    this._raf = requestAnimationFrame(loop);
  }
  disconnectedCallback() { cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); }

  _resize() {
    const r = this._canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this._w = Math.max(10, r.width); this._h = Math.max(10, r.height);
    this._canvas.width = this._w * dpr; this._canvas.height = this._h * dpr;
    this._ctx = this._canvas.getContext("2d");
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _draw(t) {
    const x = this._ctx; if (!x) return;
    const W = this._w, H = this._h;
    const dt = this._last ? Math.min(0.1, t - this._last) : 0; this._last = t;
    const BAR = 46;
    const cx = W / 2, cy = H - BAR;
    const R = Math.max(40, Math.min((W - 12) / 2.2, (cy - 6) / 1.1));
    const lw = Math.max(1.2, R / 110);
    const P = (r, a) => [cx + Math.cos((a * Math.PI) / 180) * r * R, cy - Math.sin((a * Math.PI) / 180) * r * R];
    const arc = (r, a0, a1) => { x.beginPath(); x.arc(cx, cy, r * R, -(a1 * Math.PI) / 180, -(a0 * Math.PI) / 180); x.stroke(); };
    x.clearRect(0, 0, W, H);

    // screen area with central glow
    x.save();
    x.beginPath(); x.rect(0, 0, W, cy); x.clip();
    const glow = x.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    glow.addColorStop(0, "rgba(57,240,60,0.16)"); glow.addColorStop(0.6, "rgba(57,240,60,0.05)"); glow.addColorStop(1, "rgba(57,240,60,0)");
    x.fillStyle = glow; x.fillRect(0, 0, W, cy);

    // expanding pulse ring
    const n = Math.floor(t / PERIOD), p = (t % PERIOD) / PERIOD;
    const pr = p * R * 1.3;
    if (!this._offline) {
      const a = 0.6 * Math.pow(1 - p, 0.9), th = R * 0.24;
      const g = x.createRadialGradient(cx, cy, Math.max(0, pr - th), cx, cy, pr + th * 0.25);
      g.addColorStop(0, "rgba(140,255,140,0)");
      g.addColorStop(0.7, `rgba(170,255,170,${a})`);
      g.addColorStop(0.82, `rgba(215,255,215,${a * 1.1})`);
      g.addColorStop(1, "rgba(140,255,140,0)");
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, pr + th * 0.25, 0, Math.PI * 2); x.fill();
    }

    // frame: rings, bracket bands, spokes and nodes
    x.strokeStyle = "rgba(150,255,150,0.92)"; x.lineWidth = lw; x.shadowColor = "rgba(57,240,60,0.7)"; x.shadowBlur = 4;
    arc(1, 0, 180); arc(0.5, 0, 180);
    const band = (r0, r1, a0, a1, tickOut) => {
      arc(r0, a0, a1); arc(r1, a0, a1);
      for (const [a, out] of [[a0, tickOut], [a1, 0]]) {
        const [x0, y0] = P(r0, a), [x1, y1] = P(r1 + out, a);
        x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      }
    };
    band(0.915, 0.975, 101, 151, 0.06); band(0.915, 0.975, 4, 56, 0.06); band(0.5, 0.565, 53, 101, 0.04); band(0.5, 0.565, 152, 176, 0.04);
    const node = (r, a, s) => { const [nx, ny] = P(r, a); x.beginPath(); x.arc(nx, ny, s * R, 0, Math.PI * 2); x.stroke(); };
    [[0.945, 108], [0.945, 112], [0.945, 140], [0.945, 13], [0.945, 30], [0.945, 33], [0.53, 59], [0.53, 75], [0.53, 79], [0.53, 96], [0.53, 160], [0.53, 165], [0.53, 171]]
      .forEach(([r, a]) => node(r, a, 0.011));
    const spoke = (r0, r1, a, nodeAt0) => {
      const [x0, y0] = P(r0, a), [x1, y1] = P(r1, a);
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      if (nodeAt0) node(r0, a, 0.022);
    };
    spoke(0.36, 1.03, 114, true); spoke(0.37, 1.08, 24, true); spoke(0.565, 1.03, 69, false); spoke(0.565, 1.03, 159, false);
    x.shadowBlur = 0;

    // contacts: soft dots that flare as the pulse passes, then dim
    const now = performance.now();
    this._targets = this._targets.filter((tg) => !(tg.lost && now - tg.lost > 2500));
    for (const tg of this._targets) {
      if (!tg.lost) {
        tg.d = Math.max(0.22, tg.d - dt * 0.012);
        tg.a += (Math.sin(t * 0.6 + tg.seed) * 2.5 + tg.va) * dt;
        tg.a = Math.max(18, Math.min(162, tg.a));
      }
      if (!tg.lost && pr >= tg.d * R && tg.lastPulse !== n) { tg.flash = 1; tg.lastPulse = n; }
      tg.flash *= Math.exp(-dt * 1.4);
      const life = tg.lost ? Math.max(0, 1 - (now - tg.lost) / 2500) : 1;
      const v = (0.45 + 0.55 * tg.flash) * life;
      const br = R * 0.1;
      let [bx, by] = P(tg.d, tg.a);
      by = Math.max(br, by); bx = Math.max(br, Math.min(W - br, bx));
      const gr = x.createRadialGradient(bx, by, 0, bx, by, br);
      gr.addColorStop(0, `rgba(225,255,225,${v})`);
      gr.addColorStop(0.62, `rgba(190,255,190,${v * 0.95})`);
      gr.addColorStop(1, "rgba(140,255,140,0)");
      x.fillStyle = gr; x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill();
    }
    x.restore();

    // bottom bar with readout pill
    x.fillStyle = "#1d8a22"; x.fillRect(0, cy, W, BAR);
    x.fillStyle = "rgba(57,240,60,0.55)"; x.fillRect(0, cy, W, 1);
    const live = this._targets.filter((tg) => !tg.lost);
    const blink = Math.floor(t * 2) % 2 === 0;
    const pw = Math.min(150, W * 0.3), ph = BAR + 6, px = cx - pw / 2, py = cy - 10;
    x.fillStyle = C.bg; x.strokeStyle = "rgba(57,240,60,0.55)"; x.lineWidth = 1;
    x.beginPath();
    if (x.roundRect) x.roundRect(px, py, pw, ph, [0, 0, 14, 14]); else x.rect(px, py, pw, ph);
    x.fill(); x.stroke();
    const dist = live.length ? Math.min(99.99, Math.min(...live.map((tg) => tg.d)) * this._cfg.range) : 0;
    const whole = String(Math.floor(dist)).padStart(2, "0"), dec = String(Math.floor((dist % 1) * 100)).padStart(2, "0");
    x.shadowColor = "rgba(57,240,60,0.8)"; x.shadowBlur = 6; x.textBaseline = "middle";
    x.fillStyle = live.length ? C.hi : C.fg;
    x.font = `bold 40px ${FONT}`; x.textAlign = "right";
    x.fillText(whole, cx + 6, py + ph / 2);
    x.font = `bold 15px ${FONT}`; x.textAlign = "left";
    x.fillText(dec, cx + 12, py + ph / 2 - 8); x.fillText("m", cx + 14, py + ph / 2 + 9);
    x.font = `bold 15px ${FONT}`; x.fillStyle = "#e6ffe6"; x.shadowBlur = 3;
    const ly = cy + BAR / 2 + 2;
    x.textAlign = "center";
    const leftX = (px) / 2, rightX = (px + pw + W) / 2;
    let status;
    if (this._offline) status = "NO SIGNAL";
    else if (live.length) status = blink ? `${this._kind || "MOVEMENT"} DETECTED` : "";
    else status = blink ? "SCANNING_" : "SCANNING";
    x.fillText(status, leftX, ly);
    x.fillText(`RANGE ${this._cfg.range}M`, rightX, ly);
    x.shadowBlur = 0;
  }
}
if (!customElements.get("mother-tracker-card")) customElements.define("mother-tracker-card", MotherTrackerCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "mother-tracker-card", name: "MOTHER motion tracker", description: "Green radar-style scanner for detection sensors" });
