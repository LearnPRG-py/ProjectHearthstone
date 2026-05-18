let COURSE_DATA = null;

async function loadCourseData() {
  try {
    const res = await fetch("course-data.json");
    COURSE_DATA = await res.json();
  } catch (e) {}
}

const STORAGE_KEY = "asl_progress_v2";
const TOTAL_PORTALS = 7;

function loadProgress() {
  try {
    const n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return isNaN(n) ? 1 : Math.max(1, Math.min(n, TOTAL_PORTALS));
  } catch (e) {
    return 1;
  }
}

function saveProgress(count) {
  try {
    localStorage.setItem(STORAGE_KEY, String(count));
  } catch (e) {}
}

let unlockedCount = loadProgress();

const THEMES = {
  arcane: {
    dark: "#0b0220",
    mid: "#7733cc",
    bright: "#cc99ff",
    edge: "#aa55ff",
    edgeM: "#cc99ff",
    flash: "rgba(140,60,255,0.22)",
  },
  emerald: {
    dark: "#011510",
    mid: "#11aa66",
    bright: "#66ffcc",
    edge: "#22dd88",
    edgeM: "#77ffcc",
    flash: "rgba(20,180,100,0.20)",
  },
  hellfire: {
    dark: "#160303",
    mid: "#cc3311",
    bright: "#ffaa77",
    edge: "#ff5533",
    edgeM: "#ffaa77",
    flash: "rgba(220,60,20,0.22)",
  },
  frost: {
    dark: "#010d18",
    mid: "#2266cc",
    bright: "#99ccff",
    edge: "#4499ff",
    edgeM: "#aaddff",
    flash: "rgba(50,130,255,0.22)",
  },
  gold: {
    dark: "#120c00",
    mid: "#cc8800",
    bright: "#ffdd77",
    edge: "#ffaa22",
    edgeM: "#ffe088",
    flash: "rgba(220,160,20,0.22)",
  },
  abyss: {
    dark: "#000510",
    mid: "#003366",
    bright: "#4499cc",
    edge: "#1166aa",
    edgeM: "#66bbee",
    flash: "rgba(10,80,160,0.22)",
  },
  toxic: {
    dark: "#060f02",
    mid: "#44aa00",
    bright: "#aaff44",
    edge: "#66cc00",
    edgeM: "#bbff55",
    flash: "rgba(90,200,10,0.22)",
  },
  blood: {
    dark: "#120002",
    mid: "#990011",
    bright: "#ff4455",
    edge: "#cc0022",
    edgeM: "#ff6677",
    flash: "rgba(200,10,30,0.22)",
  },
  solar: {
    dark: "#130800",
    mid: "#dd5500",
    bright: "#ffcc44",
    edge: "#ff8800",
    edgeM: "#ffdd66",
    flash: "rgba(240,130,20,0.24)",
  },
  void: {
    dark: "#050508",
    mid: "#333355",
    bright: "#9999cc",
    edge: "#555577",
    edgeM: "#aaaacc",
    flash: "rgba(80,80,140,0.22)",
  },
};

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function tornEdge(ax, ay, bx, by, nx, ny, depth, count, seed, si) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const px = ax + (bx - ax) * t,
      py = ay + (by - ay) * t;
    const h1 = hash(seed + si * 100 + i * 7.3);
    const h2 = hash(seed + si * 100 + i * 13.7 + 5);
    const h3 = hash(seed + si * 100 + i * 3.1 + 9);
    let amp;
    if (h1 > 0.65) amp = depth * (0.6 + h2 * 0.8);
    else if (h1 > 0.35) amp = depth * (0.1 + h2 * 0.4) * (h3 > 0.5 ? 1 : -0.7);
    else amp = -depth * (0.2 + h2 * 0.5);
    pts.push(px + nx * amp, py + ny * amp);
  }
  return pts;
}

function jaggedPoly(cx, cy, size, depth, density, seed) {
  const h = size / 2;
  const corners = [
    [cx - h, cy - h],
    [cx + h, cy - h],
    [cx + h, cy + h],
    [cx - h, cy + h],
  ];
  const all = [];
  for (let s = 0; s < 4; s++) {
    const [ax, ay] = corners[s],
      [bx, by] = corners[(s + 1) % 4];
    const ex = bx - ax,
      ey = by - ay,
      el = Math.hypot(ex, ey);
    let nx = -ey / el,
      ny = ex / el;
    if (((ax + bx) / 2 - cx) * nx + ((ay + by) / 2 - cy) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    all.push(ax, ay);
    for (const p of tornEdge(ax, ay, bx, by, nx, ny, depth, density, seed, s))
      all.push(p);
  }
  const s = [];
  for (let i = 0; i < all.length; i += 2)
    s.push(all[i].toFixed(1) + "," + all[i + 1].toFixed(1));
  return s.join(" ");
}

const _tickers = [];
let _masterFrame = 0;
(function masterLoop() {
  requestAnimationFrame(masterLoop);
  _masterFrame++;
  for (let i = 0; i < _tickers.length; i++) _tickers[i](_masterFrame);
})();

function makeRenderer(canvas, cfg) {
  const ctx = canvas.getContext("2d");
  const W = 240,
    H = 240,
    CX = 120,
    CY = 120;
  function hexRGB(h) {
    return [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
  }
  const [dr, dg, db] = hexRGB(cfg.dark);
  const [mr, mg, mb] = hexRGB(cfg.mid);
  const [br2, bg2, bb2] = hexRGB(cfg.bright);
  function rgbA(r, g, b, a) {
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }
  const midStr = (a) => rgbA(mr, mg, mb, a);
  const brightStr = (a) => rgbA(br2, bg2, bb2, a);
  const darkStr = (a) => rgbA(dr, dg, db, a);
  const swirlOff = document.createElement("canvas");
  swirlOff.width = W;
  swirlOff.height = H;
  const sctx = swirlOff.getContext("2d");
  const vigOff = document.createElement("canvas");
  vigOff.width = W;
  vigOff.height = H;
  const vctx = vigOff.getContext("2d");
  (function bakeVig() {
    const v = vctx.createRadialGradient(CX, CY, 42, CX, CY, 124);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(0.6, "rgba(0,0,0,0.16)");
    v.addColorStop(1, "rgba(0,0,0,0.72)");
    vctx.fillStyle = v;
    vctx.fillRect(0, 0, W, H);
  })();
  let hoverT = 0,
    burstT = 0,
    swirlBoost = 1,
    isHovered = false;
  const wisps = Array.from({length: 18}, (_, i) => ({
    angle: (i / 18) * Math.PI * 2,
    radius: 16 + (i % 6) * 14,
    speed: 0.007 + (i % 5) * 0.003,
    size: 7 + (i % 6) * 5,
    alpha: 0.18 + (i % 4) * 0.08,
    bright: i % 3 === 0,
  }));
  function tick(frame) {
    const t = frame * 0.016;
    hoverT += ((isHovered ? 1 : 0) - hoverT) * 0.07;
    if (burstT > 0.01) {
      swirlBoost = 1 + burstT * 5;
      burstT *= 0.88;
    } else {
      swirlBoost += (1 - swirlBoost) * 0.04;
    }
    const hB = 1 + hoverT * 1.1;
    ctx.fillStyle = darkStr(1);
    ctx.fillRect(0, 0, W, H);
    if (hoverT > 0.02) {
      const ag = ctx.createRadialGradient(CX, CY, 58, CX, CY, 152);
      ag.addColorStop(0, midStr(0));
      ag.addColorStop(0.5, midStr(0.06 * hoverT));
      ag.addColorStop(1, darkStr(0));
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, W, H);
    }
    sctx.clearRect(0, 0, W, H);
    for (let arm = 0; arm < 3; arm++) {
      const off2 = (arm / 3) * Math.PI * 2,
        rot = 0.22 + arm * 0.09;
      const isBright = arm === 1;
      for (let step = 0; step < 55; step++) {
        const frac = step / 55;
        const angle = off2 + frac * Math.PI * 3.8 + t * rot * swirlBoost;
        const dist = frac * 95;
        const wx = CX + Math.cos(angle) * dist,
          wy = CY + Math.sin(angle) * dist;
        const sz = (1 - frac) * 28 + 3;
        const al =
          (1 - frac) * (0.1 + hoverT * 0.11) * hB + (arm === 0 ? 0.018 : 0);
        const wg = sctx.createRadialGradient(wx, wy, 0, wx, wy, sz);
        wg.addColorStop(0, isBright ? brightStr(al) : midStr(al));
        wg.addColorStop(1, midStr(0));
        sctx.fillStyle = wg;
        sctx.beginPath();
        sctx.arc(wx, wy, sz, 0, Math.PI * 2);
        sctx.fill();
      }
    }
    ctx.drawImage(swirlOff, 0, 0);
    wisps.forEach((w, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const angle =
        w.angle +
        t * w.speed * dir * (Math.floor(i / 6) + 1) * 1.6 * swirlBoost;
      const r2 = w.radius + Math.sin(t * 0.9 + i) * 9;
      const wx = CX + Math.cos(angle) * r2,
        wy = CY + Math.sin(angle) * r2;
      const sz =
        w.size * (0.75 + Math.sin(t + i * 0.7) * 0.25) * (1 + hoverT * 0.35);
      const al = w.alpha * hB * (0.65 + Math.sin(t * 1.3 + i) * 0.35);
      const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, sz);
      wg.addColorStop(0, w.bright ? brightStr(al) : midStr(al));
      wg.addColorStop(1, midStr(0));
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(wx, wy, sz, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.drawImage(vigOff, 0, 0);
    const pulse = 0.78 + Math.sin(t * 2.2) * 0.22;
    const coreR = (42 + hoverT * 14) * pulse;
    const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, coreR);
    cg.addColorStop(0, brightStr((0.65 + hoverT * 0.25) * pulse * hB));
    cg.addColorStop(0.28, midStr(0.3));
    cg.addColorStop(0.65, midStr(0.07));
    cg.addColorStop(1, midStr(0));
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);
    const pr = (4 + hoverT * 3) * pulse;
    const pp = ctx.createRadialGradient(CX, CY, 0, CX, CY, pr * 3.5);
    pp.addColorStop(0, "rgba(255,255,255,1)");
    pp.addColorStop(0.35, brightStr(0.85));
    pp.addColorStop(1, brightStr(0));
    ctx.fillStyle = pp;
    ctx.fillRect(0, 0, W, H);
    if (burstT > 0.01) {
      const bf = ctx.createRadialGradient(CX, CY, 0, CX, CY, 135);
      bf.addColorStop(0, brightStr(Math.min(burstT * 1.1, 1)));
      bf.addColorStop(0.15, brightStr(burstT * 0.9));
      bf.addColorStop(0.45, midStr(burstT * 0.45));
      bf.addColorStop(1, midStr(0));
      ctx.fillStyle = bf;
      ctx.fillRect(0, 0, W, H);
    }
  }
  _tickers.push(tick);
  return {
    setHovered(v) {
      isHovered = v;
    },
    burst() {
      burstT = 1;
    },
  };
}

let _uid = 0;
function initPortal(wrapEl) {
  const id = ++_uid;
  const theme = wrapEl.dataset.theme || "arcane";
  const cfg = THEMES[theme] || THEMES.arcane;
  const depth = 24;
  const isTop = wrapEl.classList.contains("boss");
  const isLocked = wrapEl.classList.contains("locked");
  const polySize = isTop ? 190 : 155;
  const svgSize = isTop ? 280 : 240;

  if (isLocked) {
    const lid = id;
    const lockedLabel = wrapEl.dataset.label || "Locked";
    const pts = jaggedPoly(120, 120, polySize, depth, 14, 42.7);
    wrapEl.innerHTML = `
      <svg class="portal-svg" id="sv${lid}" width="${svgSize}" height="${svgSize}" viewBox="0 0 240 240" style="cursor:default;overflow:visible;">
        <defs>
          <clipPath id="cl${lid}"><polygon id="cp${lid}"/></clipPath>
          <radialGradient id="lg${lid}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#1a1a22" stop-opacity="1"/>
            <stop offset="100%" stop-color="#06060a" stop-opacity="1"/>
          </radialGradient>
        </defs>
        <g clip-path="url(#cl${lid})"><polygon id="ibg${lid}" fill="url(#lg${lid})"/></g>
        <polygon id="em${lid}" fill="none" stroke="#3a3a4a" stroke-width="1.6" stroke-linejoin="miter" opacity="0.9"/>
        <polygon id="eh${lid}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-linejoin="miter" stroke-width="0.5"/>
        <g class="portal-lock-icon" id="lk${lid}" opacity="0.45">
          <path d="M100,118 L100,108 A20,20 0 0,1 140,108 L140,118" fill="none" stroke="#888899" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="93" y="117" width="54" height="40" rx="6" fill="#1e1e2a" stroke="#888899" stroke-width="2.5"/>
          <circle cx="120" cy="134" r="6" fill="#888899" opacity="0.9"/>
          <rect x="117.5" y="134" width="5" height="10" rx="2" fill="#888899" opacity="0.9"/>
        </g>
        <text
          x="120" y="172"
          text-anchor="middle" dominant-baseline="middle"
          font-family="'Cinzel', 'Palatino Linotype', serif"
          font-size="${lockedLabel.length > 10 ? 9 : 10}"
          font-weight="600"
          letter-spacing="0.10em"
          fill="rgba(180,180,200,0.38)"
          style="text-transform:uppercase; pointer-events:none;"
        >${lockedLabel}</text>
      </svg>
    `;
    ["cp", "ibg", "em", "eh"].forEach((pfx) => {
      const el = document.getElementById(pfx + lid);
      if (el) el.setAttribute("points", pts);
    });
    return;
  }

  const allWrapsNow = Array.from(document.querySelectorAll(".portal-wrap"));
  const portalIdx = allWrapsNow.indexOf(wrapEl);
  const section =
    COURSE_DATA && COURSE_DATA.sections
      ? COURSE_DATA.sections[portalIdx]
      : null;
  const sectionLabel = section ? section.label : wrapEl.dataset.label || theme;
  const sectionColor = section ? section.color : cfg.bright;
  const sectionKey = section ? section.key : String(portalIdx + 1);

  wrapEl.innerHTML = `
    <svg class="portal-svg" id="sv${id}" width="${svgSize}" height="${svgSize}" viewBox="0 0 240 240">
      <defs>
        <clipPath id="cl${id}"><polygon id="cp${id}"/></clipPath>
        <filter id="fe${id}" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="fh${id}" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="ftxt${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g clip-path="url(#cl${id})"><foreignObject width="240" height="240">
        <canvas id="cv${id}" xmlns="http://www.w3.org/1999/xhtml" width="240" height="240" style="display:block"/>
      </foreignObject>
      <polygon id="ha${id}" fill="none" stroke-linejoin="miter" stroke-width="14" filter="url(#fh${id})" opacity="0"/>
      <polygon id="eg${id}" fill="none" stroke-linejoin="miter" stroke-width="7" filter="url(#fe${id})" opacity="0.6"/>
      <polygon id="em${id}" fill="none" stroke-linejoin="miter" stroke-width="1.8" opacity="1"/>
      <polygon id="eh${id}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-linejoin="miter" stroke-width="0.6"/>
      <text
        x="120" y="${isTop ? 128 : 122}"
        text-anchor="middle" dominant-baseline="middle"
        font-size="${isTop ? 14 : sectionLabel.length > 10 ? 10 : 12}"
        font-weight="700"
        letter-spacing="0.10em"
        fill="${sectionColor}"
        opacity="0.92"
        filter="url(#ftxt${id})"
        style="text-transform:uppercase; pointer-events:none; paint-order:stroke fill;"
        stroke="rgba(0,0,0,0.5)" stroke-width="3" stroke-linejoin="round"
      >${sectionLabel}</text>
    </svg>
  `;

  const svg = document.getElementById("sv" + id);
  const cp = document.getElementById("cp" + id);
  const ha = document.getElementById("ha" + id);
  const eg = document.getElementById("eg" + id);
  const em = document.getElementById("em" + id);
  const eh = document.getElementById("eh" + id);
  const canvas = document.getElementById("cv" + id);

  ha.setAttribute("stroke", cfg.bright);
  eg.setAttribute("stroke", cfg.edge);
  em.setAttribute("stroke", cfg.edgeM);

  let seedA = Math.random() * 999,
    seedB = seedA + 40 + Math.random() * 60;
  let pA = jaggedPoly(120, 120, polySize, 28, 14, seedA);
  let pB = jaggedPoly(120, 120, polySize, 28, 14, seedB);
  let mT = 0,
    hov = false;
  let svgScale = 1,
    svgScaleTarget = 1;
  let haOpacity = 0,
    haOpacityTarget = 0;
  let edgeGlowW = 7,
    edgeGlowWTarget = 7;
  let clickPhase = "idle",
    clickT = 0;

  function ss(x) {
    return x * x * (3 - 2 * x);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function interpPts(a, b, t) {
    const av = a.split(" ").map((s) => s.split(",").map(Number));
    const bv = b.split(" ").map((s) => s.split(",").map(Number));
    return av
      .map(
        ([ax, ay], i) =>
          (ax + (bv[i][0] - ax) * t).toFixed(1) +
          "," +
          (ay + (bv[i][1] - ay) * t).toFixed(1),
      )
      .join(" ");
  }
  function setPoly(pts) {
    [cp, ha, eg, em, eh].forEach((el) => el.setAttribute("points", pts));
  }
  setPoly(pA);

  function animLoop(frame) {
    if (frame % 3 === 0) {
      mT += hov ? 0.038 : 0.028;
      if (mT >= 1) {
        mT = 0;
        seedA = seedB;
        pA = pB;
        seedB = seedA + 25 + Math.random() * 45;
        pB = jaggedPoly(120, 120, polySize, hov ? 36 : 28, 14, seedB);
      }
      setPoly(interpPts(pA, pB, ss(mT)));
    }
    if (clickPhase === "compress") {
      clickT += 0.18;
      svgScaleTarget = lerp(1, 0.82, Math.min(clickT, 1));
      if (clickT >= 1) {
        clickPhase = "explode";
        clickT = 0;
      }
    } else if (clickPhase === "explode") {
      clickT += 0.14;
      svgScaleTarget = lerp(0.82, 1.22, ss(Math.min(clickT, 1)));
      edgeGlowWTarget = 7 + (1 - clickT) * 18;
      if (clickT >= 1) {
        clickPhase = "settle";
        clickT = 0;
      }
    } else if (clickPhase === "settle") {
      clickT += 0.06;
      svgScaleTarget = lerp(1.22, 1, ss(Math.min(clickT, 1)));
      if (clickT >= 1) {
        clickPhase = "idle";
        svgScaleTarget = hov ? 1.07 : 1;
      }
    } else {
      svgScaleTarget = hov ? 1.07 : 1;
    }
    const ambientHalo = 0.12 + Math.sin(Date.now() * 0.0018 + id) * 0.06;
    haOpacityTarget = hov
      ? 0.42 + Math.sin(Date.now() * 0.003) * 0.15
      : ambientHalo;
    svgScale = lerp(svgScale, svgScaleTarget, 0.12);
    haOpacity = lerp(haOpacity, haOpacityTarget, 0.06);
    edgeGlowW = lerp(edgeGlowW, edgeGlowWTarget, 0.12);
    svg.style.transform = `scale(${svgScale.toFixed(4)})`;
    const glowSize = hov
      ? (haOpacity * 32).toFixed(1)
      : (ambientHalo * 16).toFixed(1);
    svg.style.filter = hov
      ? `brightness(${(1.15 + haOpacity * 0.3).toFixed(3)}) drop-shadow(0 0 ${glowSize}px ${cfg.edge})`
      : `brightness(1.04) drop-shadow(0 0 ${glowSize}px ${cfg.edge})`;
    ha.setAttribute("opacity", haOpacity.toFixed(3));
    eg.setAttribute("stroke-width", edgeGlowW.toFixed(1));
  }
  _tickers.push(animLoop);

  const ren = makeRenderer(canvas, cfg);

  svg.addEventListener("mouseenter", () => {
    hov = true;
    wrapEl.classList.add("hovered");
    ren.setHovered(true);
    seedB = seedA + 20 + Math.random() * 35;
    pB = jaggedPoly(120, 120, polySize, 32, 14, seedB);
  });
  svg.addEventListener("mouseleave", () => {
    hov = false;
    wrapEl.classList.remove("hovered");
    ren.setHovered(false);
    seedB = seedA + 30 + Math.random() * 50;
    pB = jaggedPoly(120, 120, polySize, depth, 14, seedB);
  });
  svg.addEventListener("click", () => {
    if (clickPhase !== "idle") return;
    clickPhase = "compress";
    clickT = 0;
    ren.burst();
    flashOverlay.style.background = cfg.flash;
    flashOverlay.classList.remove("flash");
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add("flash");
    document.body.style.transform = "translate(3px,-2px)";
    setTimeout(() => {
      document.body.style.transform = "translate(-2px,3px)";
    }, 40);
    setTimeout(() => {
      document.body.style.transform = "translate(2px,-1px)";
    }, 80);
    setTimeout(() => {
      document.body.style.transform = "translate(0,0)";
    }, 120);
    try {
      localStorage.setItem("asl_current_section", sectionKey);
    } catch (e) {}
    setTimeout(() => {
      window.location.href = `course_video/course_video.html?section=${sectionKey}`;
    }, 480);
  });
}

function unlockNextPortal() {
  const wraps = Array.from(document.querySelectorAll(".portal-wrap"));
  const nextWrap = wraps[unlockedCount];
  if (!nextWrap || !nextWrap.classList.contains("locked")) return;

  nextWrap.style.opacity = "0";
  nextWrap.style.transition =
    "opacity 0.9s ease, transform 0.9s cubic-bezier(0.34,1.56,0.64,1)";
  nextWrap.style.transform = "translate(-50%,-50%) scale(0.4)";
  nextWrap.classList.remove("locked");
  nextWrap.innerHTML = "";
  initPortal(nextWrap);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      nextWrap.style.opacity = "1";
      nextWrap.style.transform = "translate(-50%,-50%) scale(1)";
    }),
  );

  unlockedCount++;
  saveProgress(unlockedCount);
  updateProgressDots();

  const theme = nextWrap.dataset.theme || "arcane";
  const cfg = THEMES[theme] || THEMES.arcane;
  setTimeout(() => {
    flashOverlay.style.background = cfg.flash;
    flashOverlay.classList.remove("flash");
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add("flash");
  }, 200);
}

function applyInitialLockState() {
  document.querySelectorAll(".portal-wrap").forEach((wrap, i) => {
    wrap.classList.toggle("locked", i >= unlockedCount);
  });
}

function updateProgressDots() {
  document.querySelectorAll(".pdot").forEach((dot, i) => {
    dot.classList.toggle("on", i < unlockedCount);
  });
}

const WORLD_W = 3200;
const WORLD_H = 3200;
const MM_W = 88;
const MM_H = 88;

const PORTALS = [
  {x: 700, y: 2680, color: "34,221,136", label: "Foundations"},
  {x: 2780, y: 2620, color: "68,153,255", label: "Everyday Vocab"},
  {x: 1100, y: 2100, color: "255,170,34", label: "Quantity & Time"},
  {x: 2150, y: 1780, color: "255,85,51", label: "Actions & Feelings"},
  {x: 680, y: 1480, color: "102,204,0", label: "ASL Grammar"},
  {x: 2600, y: 1080, color: "180,0,34", label: "Conversation"},
  {x: 1600, y: 310, color: "140,60,255", label: "Fluency"},
];

let currentPortalIdx = 0;

const viewport = document.getElementById("viewport");
const world = document.getElementById("world");
const mmVPBox = document.getElementById("mm-viewport-box");
const minimap = document.getElementById("minimap");
const flashOverlay = document.getElementById("flashOverlay");
const navIndex = document.getElementById("nav-index");

let tx = 0,
  ty = 0,
  camScale = 1;
let dragging = false,
  startX,
  startY,
  startTx,
  startTy;
let isFlying = false;
let mapMode = false;

world.style.transformOrigin = "0 0";

function commitTransform(animated, duration) {
  const dur = duration !== undefined ? duration : animated ? 0.82 : 0;
  if (animated) {
    isFlying = true;
    world.style.transition = `transform ${dur}s cubic-bezier(0.4,0,0.2,1)`;
  } else {
    world.style.transition = "none";
  }
  world.style.transform = `translate(${tx}px,${ty}px) scale(${camScale})`;
  updateMinimap();
  if (animated) {
    const onEnd = () => {
      world.removeEventListener("transitionend", onEnd);
      world.style.transition = "none";
      isFlying = false;
    };
    world.addEventListener("transitionend", onEnd);
  }
}

function clampCamera() {
  const sw = WORLD_W * camScale,
    sh = WORLD_H * camScale;
  const vw = window.innerWidth,
    vh = window.innerHeight;
  tx = Math.max(
    sw < vw ? (vw - sw) / 2 : -(sw - vw),
    Math.min(sw < vw ? (vw - sw) / 2 : 0, tx),
  );
  ty = Math.max(
    sh < vh ? (vh - sh) / 2 : -(sh - vh),
    Math.min(sh < vh ? (vh - sh) / 2 : 0, ty),
  );
}

function flyToPoint(wx, wy, targetScale, animated, duration) {
  camScale = targetScale;
  tx = window.innerWidth / 2 - wx * camScale;
  ty = window.innerHeight / 2 - wy * camScale;
  clampCamera();
  commitTransform(animated, duration);
}

function centerOnPortal(idx, animated) {
  mapMode = false;
  viewport.classList.remove("map-mode");
  const p = PORTALS[idx];
  flyToPoint(p.x, p.y, 1, animated, 0.82);
  currentPortalIdx = idx;
  navIndex.textContent = idx + 1 + " / " + PORTALS.length;
}

function flyToMap() {
  mapMode = true;
  viewport.classList.add("map-mode");
  const pad = 60;
  const targetScale = Math.min(
    (window.innerWidth - pad * 2) / WORLD_W,
    (window.innerHeight - pad * 2) / WORLD_H,
  );
  camScale = targetScale;
  tx = (window.innerWidth - WORLD_W * camScale) / 2;
  ty = (window.innerHeight - WORLD_H * camScale) / 2;
  commitTransform(true, 0.85);
  navIndex.textContent = "· / " + PORTALS.length;
}

function exitMapToPortal(idx) {
  mapMode = false;
  viewport.classList.remove("map-mode");
  const p = PORTALS[idx];
  flyToPoint(p.x, p.y, 1, true, 0.85);
  currentPortalIdx = idx;
  navIndex.textContent = idx + 1 + " / " + PORTALS.length;
}

function applyTransform(animated) {
  clampCamera();
  commitTransform(animated);
}

function updateMinimap() {
  const scaleX = MM_W / WORLD_W,
    scaleY = MM_H / WORLD_H;
  mmVPBox.style.left = -tx * scaleX + "px";
  mmVPBox.style.top = -ty * scaleY + "px";
  mmVPBox.style.width = window.innerWidth * scaleX + "px";
  mmVPBox.style.height = window.innerHeight * scaleY + "px";
}

PORTALS.forEach((p) => {
  const dot = document.createElement("div");
  dot.className = "mm-dot";
  dot.style.left = (p.x / WORLD_W) * MM_W + "px";
  dot.style.top = (p.y / WORLD_H) * MM_H + "px";
  dot.style.background = `rgb(${p.color})`;
  dot.style.boxShadow = `0 0 5px rgb(${p.color})`;
  minimap.appendChild(dot);
});

applyInitialLockState();
flyToMap();
updateProgressDots();

viewport.addEventListener("mousedown", (e) => {
  if (e.target.closest(".portal-wrap")) return;
  if (isFlying) return;
  if (mapMode) {
    const worldX = (e.clientX - tx) / camScale;
    const worldY = (e.clientY - ty) / camScale;
    let bestIdx = currentPortalIdx,
      bestDist = Infinity;
    PORTALS.forEach((p, i) => {
      const d = Math.hypot(p.x - worldX, p.y - worldY);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    exitMapToPortal(bestIdx);
    return;
  }
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  startTx = tx;
  startTy = ty;
  viewport.classList.add("panning");
});
window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  tx = startTx + (e.clientX - startX);
  ty = startTy + (e.clientY - startY);
  applyTransform(false);
});
window.addEventListener("mouseup", () => {
  dragging = false;
  viewport.classList.remove("panning");
});

let touchStartX, touchStartY, touchStartTx, touchStartTy;
viewport.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTx = tx;
    touchStartTy = ty;
  },
  {passive: true},
);
viewport.addEventListener(
  "touchmove",
  (e) => {
    tx = touchStartTx + (e.touches[0].clientX - touchStartX);
    ty = touchStartTy + (e.touches[0].clientY - touchStartY);
    applyTransform(false);
  },
  {passive: true},
);

viewport.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    tx -= e.deltaX;
    ty -= e.deltaY;
    applyTransform(false);
  },
  {passive: false},
);

window.addEventListener("resize", () => {
  clampCamera();
  commitTransform(false);
  updateMinimap();
});

document.getElementById("btn-home").addEventListener("click", flyToMap);
document
  .getElementById("btn-current")
  .addEventListener("click", () => centerOnPortal(unlockedCount - 1, true));
document
  .getElementById("btn-prev")
  .addEventListener("click", () =>
    centerOnPortal(
      (currentPortalIdx - 1 + PORTALS.length) % PORTALS.length,
      true,
    ),
  );
document
  .getElementById("btn-next")
  .addEventListener("click", () =>
    centerOnPortal((currentPortalIdx + 1) % PORTALS.length, true),
  );

loadCourseData().then(() => {
  if (COURSE_DATA && COURSE_DATA.sections) {
    injectWorldDecorations();
    document.querySelectorAll(".portal-wrap").forEach((el, i) => {
      const sec = COURSE_DATA.sections[i];
      if (sec) {
        el.dataset.theme = sec.theme;
        el.dataset.label = sec.label;
      }
      initPortal(el);
    });
    injectCurrentLessonBadge();
  } else {
    document.querySelectorAll(".portal-wrap").forEach((el) => initPortal(el));
  }
});

function injectCurrentLessonBadge() {
  const savedSection = localStorage.getItem("asl_current_section");
  const savedVideo = localStorage.getItem("asl_current_video");
  if (!savedSection || !COURSE_DATA) return;

  const secIdx = COURSE_DATA.sections.findIndex((s) => s.key === savedSection);
  if (secIdx < 0) return;

  const section = COURSE_DATA.sections[secIdx];
  let vidIdx = savedVideo
    ? section.videos.findIndex((v) => v.id === savedVideo)
    : 0;
  if (vidIdx < 0) vidIdx = 0;

  const video = section.videos[vidIdx];
  if (!video) return;

  const wraps = document.querySelectorAll(".portal-wrap");
  const targetWrap = wraps[secIdx];
  if (!targetWrap || targetWrap.classList.contains("locked")) return;

  const badge = document.createElement("div");
  badge.className = "portal-current-lesson";
  badge.innerHTML = `
    <div class="pcl-eyebrow">Current Lesson</div>
    <div class="pcl-title">${video.title}</div>
  `;
  badge.style.setProperty("--pcl-color", section.color);
  targetWrap.appendChild(badge);
}

function injectWorldDecorations() {
  const sections = COURSE_DATA.sections;
  const positions = PORTALS;
  const svg = document.getElementById("path-svg");

  let svgContent = "";

  const pathControlPoints = [
    {cx1: 1400, cy1: 2750, cx2: 2200, cy2: 2700},
    {cx1: 2400, cy1: 2500, cx2: 1400, cy2: 2200},
    {cx1: 1300, cy1: 1950, cx2: 1900, cy2: 1850},
    {cx1: 1800, cy1: 1700, cx2: 900, cy2: 1600},
    {cx1: 800, cy1: 1300, cx2: 2000, cy2: 1150},
    {cx1: 2400, cy1: 900, cx2: 1900, cy2: 600},
  ];

  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i],
      b = positions[i + 1];
    const rgb = sections[i].portalColor;
    const cp = pathControlPoints[i];
    svgContent += `<path d="M${a.x},${a.y} C${cp.cx1},${cp.cy1} ${cp.cx2},${cp.cy2} ${b.x},${b.y}"
      stroke="rgba(${rgb},0.55)" stroke-width="5" fill="none" stroke-dasharray="9 12"/>\n`;
  }

  positions.forEach((p, i) => {
    const rgb = sections[i].portalColor;
    const isTop = i === sections.length - 1;
    const op1 = isTop ? 0.24 : 0.22,
      op2 = isTop ? 0.24 : 0.14;
    const sw1 = 1.6,
      sw2 = isTop ? 1.6 : 1.0;
    if (isTop) {
      svgContent += `<line x1="${p.x}" y1="${p.y}" x2="${p.x - 40}" y2="${p.y - 62}" stroke="rgba(${rgb},${op1})" stroke-width="${sw1}" stroke-linecap="round"/>
<line x1="${p.x}" y1="${p.y}" x2="${p.x + 40}" y2="${p.y - 64}" stroke="rgba(${rgb},${op1})" stroke-width="${sw1}" stroke-linecap="round"/>
<line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${p.y - 72}" stroke="rgba(${rgb},0.16)" stroke-width="1.2" stroke-linecap="round"/>\n`;
    } else {
      svgContent += `<line x1="${p.x}" y1="${p.y}" x2="${p.x - 18}" y2="${p.y + 66}" stroke="rgba(${rgb},${op1})" stroke-width="${sw1}" stroke-linecap="round"/>
<line x1="${p.x}" y1="${p.y}" x2="${p.x + 20}" y2="${p.y + 62}" stroke="rgba(${rgb},${op2})" stroke-width="${sw2}" stroke-linecap="round"/>\n`;
    }
  });

  svg.innerHTML = svgContent;
}

(function () {
  const canvas = document.getElementById("star-canvas");
  const ctx = canvas.getContext("2d");
  let W,
    H,
    stars = [],
    shootingStars = [];
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();
  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / 2200);
    for (let i = 0; i < count; i++) {
      const tier = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r:
          tier > 0.92
            ? 1.4 + Math.random() * 0.8
            : tier > 0.7
              ? 0.8 + Math.random() * 0.5
              : 0.3 + Math.random() * 0.4,
        baseAlpha: 0.15 + Math.random() * 0.75,
        twinkleSpeed: 0.5 + Math.random() * 2.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: (() => {
          const r = Math.random();
          return r > 0.93
            ? [180, 200, 255]
            : r > 0.87
              ? [255, 240, 200]
              : r > 0.82
                ? [200, 160, 255]
                : [220, 220, 240];
        })(),
      });
    }
  }
  initStars();
  window.addEventListener("resize", initStars);
  function spawnShooting() {
    if (shootingStars.length < 3 && Math.random() < 0.004) {
      const angle = -0.3 + Math.random() * 0.4;
      shootingStars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.5,
        vx: Math.cos(angle) * (4 + Math.random() * 6),
        vy: Math.sin(angle) * (4 + Math.random() * 6) + 1.5,
        len: 60 + Math.random() * 100,
        alpha: 0.8 + Math.random() * 0.2,
        life: 1.0,
      });
    }
  }
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = frame * 0.016;
    stars.forEach((s) => {
      const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
      const al = s.baseAlpha * (0.45 + 0.55 * tw);
      const [r, g, b] = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${al.toFixed(3)})`;
      ctx.fill();
      if (s.r > 1.0 && al > 0.5) {
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.5);
        grd.addColorStop(0, `rgba(${r},${g},${b},${(al * 0.3).toFixed(3)})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    });
    spawnShooting();
    shootingStars = shootingStars.filter((s) => s.life > 0.01);
    shootingStars.forEach((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.life *= 0.94;
      const g = ctx.createLinearGradient(
        s.x - (s.vx * s.len) / 6,
        s.y - (s.vy * s.len) / 6,
        s.x,
        s.y,
      );
      g.addColorStop(0, `rgba(255,255,255,0)`);
      g.addColorStop(1, `rgba(255,255,255,${(s.alpha * s.life).toFixed(3)})`);
      ctx.beginPath();
      ctx.moveTo(s.x - (s.vx * s.len) / 6, s.y - (s.vy * s.len) / 6);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    frame++;
    requestAnimationFrame(draw);
  }
  draw();
})();

(function () {
  const layer = document.getElementById("ambient-layer");
  const blobs = [
    {
      color: "60,20,120",
      size: 600,
      x: 10,
      y: 5,
      dur: 38,
      op: [0.045, 0.085],
      dx: ["30px", "-20px"],
      dy: ["20px", "40px"],
    },
    {
      color: "0,40,120",
      size: 500,
      x: 75,
      y: 15,
      dur: 52,
      op: [0.035, 0.065],
      dx: ["-40px", "15px"],
      dy: ["30px", "-25px"],
    },
    {
      color: "80,10,60",
      size: 450,
      x: 45,
      y: 60,
      dur: 45,
      op: [0.04, 0.07],
      dx: ["20px", "-35px"],
      dy: ["-30px", "20px"],
    },
    {
      color: "20,80,60",
      size: 400,
      x: 20,
      y: 80,
      dur: 60,
      op: [0.025, 0.055],
      dx: ["35px", "-10px"],
      dy: ["-20px", "30px"],
    },
    {
      color: "100,30,20",
      size: 480,
      x: 80,
      y: 70,
      dur: 42,
      op: [0.03, 0.06],
      dx: ["-25px", "30px"],
      dy: ["25px", "-40px"],
    },
    {
      color: "40,60,140",
      size: 550,
      x: 55,
      y: 35,
      dur: 56,
      op: [0.03, 0.055],
      dx: ["15px", "-30px"],
      dy: ["-35px", "15px"],
    },
  ];
  blobs.forEach((b, i) => {
    const el = document.createElement("div");
    el.className = "nebula-blob";
    el.style.cssText = `width:${b.size}px;height:${b.size * 0.7}px;left:${b.x}%;top:${b.y}%;
        background:radial-gradient(ellipse at center,rgba(${b.color},0.18) 0%,rgba(${b.color},0.06) 50%,transparent 75%);
        --nb-op-lo:${b.op[0]};--nb-op-hi:${b.op[1]};--dx1:${b.dx[0]};--dy1:${b.dy[0]};--dx2:${b.dx[1]};--dy2:${b.dy[1]};
        animation-duration:${b.dur}s;animation-delay:${-i * 7.3}s;opacity:${b.op[0]};`;
    layer.appendChild(el);
  });
})();

(function () {
  const colors = [
    "140,60,255",
    "34,221,136",
    "68,153,255",
    "255,170,34",
    "255,85,51",
    "102,204,0",
  ];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement("div");
    el.className = "dust-mote";
    const size = 1 + Math.random() * 2.5,
      color = colors[Math.floor(Math.random() * colors.length)];
    const op = 0.1 + Math.random() * 0.3,
      dur = 12 + Math.random() * 24;
    el.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${20 + Math.random() * 70}%;
        background:rgba(${color},0.8);box-shadow:0 0 ${size * 3}px rgba(${color},0.6);
        --mote-op:${op};--mote-dx:${(Math.random() - 0.5) * 80}px;--mote-dy:${-40 - Math.random() * 120}px;
        animation-duration:${dur}s;animation-delay:${-Math.random() * dur}s;filter:blur(${size > 2 ? 0.5 : 0}px);`;
    document.body.appendChild(el);
  }
})();
