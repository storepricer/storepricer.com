/* StorePricer landing page. Built by tools/assemble.py from docs/design; edit the previews, then rebuild. */
/* Hero concepts: timeline engine, helpers, the store builder and the Main Street Electronics catalog.
   Every concept draws itself from render(t) with t in seconds, so any moment can be
   frozen with ?t=4.5 (for headless frame capture) or scrubbed with the preview bar. */
(function () {
  const q = new URLSearchParams(location.search);

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = {
    out: p => 1 - Math.pow(1 - p, 3),
    out4: p => 1 - Math.pow(1 - p, 4),
    inOut: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    in: p => p * p * p,
    expo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    back: (p, s = 1.5) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
  };
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const money = n => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Price rule: cost times markup, rounded up to the next price ending in .99
  const end99 = x => { const c = Math.round(x * 100); return Math.ceil((c - 99) / 100) + 0.99; };
  const round2 = x => Math.round(x * 100) / 100;

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------- stores ----------
  // A store is a list of real products, each brand priced by a plan (cost times markup, ending in .99).
  // Product names are used for illustration; costs and prices are examples.
  // makeStore(items, plans, hot, rise, extra): hot is the brand whose costs just rose by rise (1.06 is +6%).
  // extra adds single cost rises by product name and variant, e.g. { 'Google Nest Cam|Indoor': 1.05 }.
  function makeStore(ITEMS, PLANS, hot, rise, extra = {}) {
    // Variant code: first letter plus consonants, e.g. Black BLC, Silver SLV
    const code = v => { const w = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase(); return (w[0] + w.slice(1).replace(/[AEIOU]/g, '')).slice(0, 3); };
    function makeRow(it, vi) {
      const [brand, product, stem, variants, cost] = it;
      const v = variants[vi % variants.length];
      const p = PLANS[brand];
      const row = {
        brand, product, name: brand + ' ' + product, variant: v,
        sku: stem + (v ? '-' + code(v) : ''),
        plan: p.plan, markup: p.markup, cost,
        price: end99(cost * p.markup),
      };
      const rs = brand === hot ? rise : extra[row.name + '|' + v];
      row.sonara = !!rs;   // this row's cost just rose
      if (rs) { row.rise = rs; row.newCost = round2(cost * rs); row.newPrice = end99(row.newCost * p.markup); }
      return row;
    }
    // every variant of the hot brand, in the order a Price Update lists them
    const HOT = [];
    ITEMS.filter(i => i[0] === hot).forEach(it => it[3].forEach((_, vi) => HOT.push(makeRow(it, vi))));
    // a long mixed catalog; share sets the fraction of hot-brand rows
    function catalog(n, seed = 7, share = 0.3) {
      const r = rng(seed), out = [];
      const son = ITEMS.filter(i => i[0] === hot), rest = ITEMS.filter(i => i[0] !== hot);
      for (let k = 0; k < n; k++) {
        const pool = son.length && r() < share ? son : rest;
        let row;
        do row = makeRow(pool[Math.floor(r() * pool.length)], Math.floor(r() * 3));
        while (out.length && out[out.length - 1].sku === row.sku);
        out.push(row);
      }
      return out;
    }
    return { ITEMS, PLANS, HOT, makeRow, catalog };
  }

  // Main Street Electronics. Sony raised its costs 6%; Google Nest raised the Cam Indoor 5%.
  const PLANS = {
    Sony: { plan: 'Audio plan', markup: 1.38 },
    Samsung: { plan: 'TV plan', markup: 1.22 },
    LG: { plan: 'TV plan', markup: 1.22 },
    Apple: { plan: 'Computing plan', markup: 1.18 },
    Lenovo: { plan: 'Computing plan', markup: 1.18 },
    Anker: { plan: 'Computing plan', markup: 1.18 },
    Ring: { plan: 'Smart home plan', markup: 1.42 },
    'Google Nest': { plan: 'Smart home plan', markup: 1.42 },
    Kasa: { plan: 'Smart home plan', markup: 1.42 },
    Garmin: { plan: 'Wearables plan', markup: 1.35 },
    Fitbit: { plan: 'Wearables plan', markup: 1.35 },
    Withings: { plan: 'Wearables plan', markup: 1.35 },
  };
  // [brand, product, sku stem, variants, cost]
  const ITEMS = [
    ['Sony', 'WH-1000XM4 Wireless Headphones', 'SNY-XM4', ['Black', 'Silver', 'Midnight Blue'], 170.54],
    ['Sony', 'WF-C700N Wireless Earbuds', 'SNY-C700N', ['White', 'Black', 'Lavender'], 80.20],
    ['Sony', 'HT-S2000 Soundbar', 'SNY-HTS2000', [''], 300.05],
    ['Sony', 'SA-SW3 Wireless Subwoofer', 'SNY-SASW3', [''], 200.10],
    ['Sony', 'SRS-XB100 Portable Speaker', 'SNY-XB100', ['Blue', 'Black', 'Orange'], 53.80],
    ['Sony', 'SRS-XV500 Party Speaker', 'SNY-XV500', [''], 250.10],
    ['Sony', 'SA-RS3S Wireless Rear Speakers', 'SNY-RS3S', [''], 143.40],
    ['Sony', 'SRS-XE300 Portable Speaker', 'SNY-XE300', ['Black', 'Blue'], 144.90],
    ['Sony', 'SRS-XE200 Portable Speaker', 'SNY-XE200', ['Black', 'Blue', 'Orange'], 94.15],
    ['Sony', 'MDR-ZX110 Headphones', 'SNY-ZX110', ['Black', 'White'], 14.45],
    ['Sony', 'PS-LX310BT Turntable', 'SNY-LX310', [''], 181.10],
    ['Sony', 'WH-CH520 Wireless Headphones', 'SNY-CH520', ['Black', 'White', 'Blue'], 43.40],
    ['Sony', 'WH-CH720N Wireless Headphones', 'SNY-CH720N', ['Black', 'Blue'], 108.60],
    ['Sony', 'LinkBuds S Earbuds', 'SNY-LBS', ['Black', 'White'], 144.90],
    ['Sony', 'WF-1000XM5 Earbuds', 'SNY-XM5E', ['Black', 'Silver'], 217.30],
    ['Sony', 'WF-C510 Earbuds', 'SNY-C510', ['Blue', 'Black', 'White'], 39.58],
    ['Sony', 'HT-S400 Soundbar', 'SNY-HTS400', [''], 202.80],
    ['Sony', 'HT-S100F Soundbar', 'SNY-S100F', [''], 94.15],
    ['Sony', 'SRS-XG300 Portable Speaker', 'SNY-XG300', ['Black', 'Gray'], 253.60],
    ['Sony', 'STR-DH190 Stereo Receiver', 'SNY-DH190', [''], 181.10],
    ['Sony', 'ICF-C1 Clock Radio', 'SNY-ICFC1', ['Black'], 21.70],
    ['Sony', 'MDR-7506 Studio Headphones', 'SNY-7506', [''], 72.40],
    ['Sony', 'WH-1000XM5 Wireless Headphones', 'SNY-XM5', ['Black', 'Silver', 'Midnight Blue'], 253.60],
    ['Sony', 'ULT Field 1 Speaker', 'SNY-ULTF1', ['Black', 'White', 'Forest Gray'], 94.15],
    ['Samsung', '55 in Crystal UHD 4K TV', 'SAM-CU55', [''], 327.10],
    ['Samsung', '65 in QLED 4K TV', 'SAM-Q65', [''], 573.70],
    ['Samsung', '50 in Crystal UHD 4K TV', 'SAM-CU50', [''], 278.00],
    ['LG', '65 in OLED evo C4 TV', 'LG-C465', [''], 1393.40],
    ['LG', '55 in OLED evo C4 TV', 'LG-C455', [''], 982.70],
    ['Apple', 'MacBook Air 13 in M3', 'APL-MBA13', ['8 GB', '16 GB'], 847.40],
    ['Lenovo', 'Yoga 7i 16 in Laptop', 'LEN-Y7I16', ['512 GB', '1 TB'], 762.70],
    ['Anker', '555 USB-C Hub', 'ANK-555', [''], 42.35],
    ['Ring', 'Video Doorbell', 'RNG-VDB', [''], 70.40],
    ['Google Nest', 'Cam', 'NST-CAM', ['Indoor', 'Outdoor'], 70.40],
    ['Kasa', 'Smart Plug Mini 4 Pack', 'KSA-EP10', [''], 21.12],
    ['Garmin', 'Forerunner 165', 'GRM-FR165', ['Black', 'Mist Gray'], 185.15],
    ['Fitbit', 'Charge 6', 'FIT-CH6', ['Obsidian', 'Coral'], 118.50],
    ['Withings', 'Body Smart Scale', 'WTH-BODY', [''], 74.05],
  ];
  // Google Nest also raised the cost of the Cam Indoor 5%: one more price in the day's total (2,319)
  const MAIN = makeStore(ITEMS, PLANS, 'Sony', 1.06, { 'Google Nest Cam|Indoor': 1.05 });
  const { makeRow, catalog } = MAIN, SONARA = MAIN.HOT;

  // ---------- cached DOM writes ----------
  const cache = new WeakMap();
  function put(el, key, val) {
    let c = cache.get(el); if (!c) { c = {}; cache.set(el, c); }
    if (c[key] === val) return;
    c[key] = val;
    if (key === 'text') el.textContent = val;
    else if (key === 'html') el.innerHTML = val;
    else if (key === 'class') el.className = val;
    else if (key.startsWith('--')) el.style.setProperty(key, val);
    else if (key.startsWith('@')) el.setAttribute(key.slice(1), val);
    else el.style[key] = val;
  }

  // ---------- per-digit counter (mechanical: a place rolls as the place below passes 9) ----------
  function odo(el) {
    el.classList.add('odo');
    el.setAttribute('aria-hidden', 'true');
    const places = [];
    for (let k = 5; k >= 0; k--) {
      const d = document.createElement('span');
      d.className = 'odo-d';
      d.innerHTML = '<span>' + '0123456789'.split('').join('<br>') + '<br>0</span>';
      const sep = k === 3 ? document.createElement('span') : null;
      if (sep) { sep.className = 'odo-s'; sep.textContent = ','; }
      el.appendChild(d); if (sep) el.appendChild(sep);
      places.push({ k, d, strip: d.firstChild, sep });
    }
    let last = null;
    return function set(v) {
      v = Math.max(0, v);
      const key = v.toFixed(3); if (key === last) return; last = key;
      places.forEach(({ k, d, strip, sep }) => {
        const on = k === 0 || v >= Math.pow(10, k);
        put(d, 'display', on ? '' : 'none');
        if (sep) put(sep, 'display', v >= 1000 ? '' : 'none');
        if (!on) return;
        const unit = Math.pow(10, k), whole = Math.floor(v / unit) % 10;
        const below = (v % unit) / unit;
        const pos = k === 0 ? v % 10 : whole + Math.max(0, (below - 0.92) / 0.08);
        put(strip, 'transform', 'translateY(' + (-pos * 100 / 11).toFixed(3) + '%)');
      });
    };
  }

  // ---------- the timeline ----------
  // run({ render, layout, duration, name, root }). With root (the assembled page), there is no preview bar:
  // the section's clock starts when it scrolls into view and pauses while it is off screen.
  function run({ render, layout, duration, name, root: sec }) {
    const root = document.documentElement, page = !!sec;
    const frozenAt = q.has('t') ? parseFloat(q.get('t')) : null;
    if (q.get('chrome') === '0') root.classList.add('nochrome');
    // ?embed=1: shown inside the draft page. No preview bar or context bands, the clock waits
    // until the section scrolls into view, and the page reports its height to the draft page.
    const embed = q.get('embed') === '1';
    if (embed) root.classList.add('embed', 'nochrome');
    let playing = frozenAt === null, t0 = 0, tHeld = frozenAt || 0;
    const now = () => performance.now() / 1000;
    const current = () => (playing ? now() - t0 : tHeld);

    let bar, range, out, pp;
    function chrome() {
      bar = document.createElement('div');
      bar.className = 'pv';
      bar.innerHTML = '<span class="pv-name"><b>' + name + '</b></span><button type="button" data-r>Replay</button><button type="button" data-p>Pause</button><input type="range" min="0" max="' + duration + '" step="0.01" value="0" aria-label="Scrub the hero timeline"><output>0.0s</output><a href="index.html">All concepts</a>';
      document.body.appendChild(bar);
      range = bar.querySelector('input'); out = bar.querySelector('output'); pp = bar.querySelector('[data-p]');
      bar.querySelector('[data-r]').onclick = () => { playing = true; t0 = now(); pp.textContent = 'Pause'; };
      pp.onclick = () => {
        if (playing) { tHeld = current(); playing = false; pp.textContent = 'Play'; }
        else { playing = true; t0 = now() - tHeld; pp.textContent = 'Pause'; }
      };
      range.oninput = () => { playing = false; tHeld = parseFloat(range.value); pp.textContent = 'Play'; draw(); };
    }

    function draw() {
      const t = current();
      render(t);
      if (out) { out.value = Math.min(t, 99).toFixed(1) + 's'; if (playing) range.value = Math.min(t, duration); }
    }
    let raf = 0, started = false, paused = false;
    function tick() { draw(); raf = requestAnimationFrame(tick); }

    function relayout() { if (layout) layout(); draw(); }
    let rz; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(relayout); });

    function start() {
      if (layout) layout();
      t0 = now(); started = true;
      if (frozenAt !== null) { root.classList.add('frozen'); render(frozenAt); return; }
      raf = requestAnimationFrame(tick);
    }
    function report() { parent.postMessage({ sp: 'height', id: q.get('id'), h: document.body.getBoundingClientRect().height }, '*'); }
    function startWhenSeen() {
      if (page) {
        const io = new IntersectionObserver(es => {
          const e = es[es.length - 1];
          if (!started) { if (e.intersectionRatio >= 0.12 || (e.isIntersecting && e.boundingClientRect.top < innerHeight * 0.6)) start(); return; }
          if (frozenAt !== null) return;
          if (!e.isIntersecting && playing) { tHeld = current(); playing = false; paused = true; cancelAnimationFrame(raf); }
          else if (e.isIntersecting && paused) { paused = false; playing = true; t0 = now() - tHeld; raf = requestAnimationFrame(tick); }
        }, { threshold: [0, 0.12, 0.3] });
        return io.observe(sec);
      }
      if (!embed) return start();
      report(); new ResizeObserver(report).observe(document.body);
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]'); const to = a && a.getAttribute('href').slice(1);
        if (!to) return; e.preventDefault(); parent.postMessage({ sp: 'go', to }, '*');
      });
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { threshold: 0.2 });
      io.observe(document.body);
    }
    if (!page) chrome();
    if (layout) layout();
    render(frozenAt !== null ? frozenAt : 0);
    // Start once fonts are in, so the intro is not spent on fallback type
    const fontsIn = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsIn, new Promise(r => setTimeout(r, 1500))]).then(startWhenSeen);
  }

  window.HC = { odo, q, clamp, seg, lerp, ease, fmt, money, end99, round2, rng, PLANS, ITEMS, SONARA, catalog, makeRow, makeStore, put, run };
})();

/* ===== top ===== */
(function (root) {
(() => {
  const { seg, lerp, ease, clamp, money, put, catalog } = HC;
  const $ = s => root.querySelector(s);
  const floor = $('#top-floor'), rowsEl = $('#top-rows'), beam = $('#top-beam'), check = $('#top-check');
  const CAT = catalog(900, 21, 0.34);
  const RH = 58, PLANE = 2600, N = Math.ceil(PLANE / RH) + 2;
  const setChk = HC.odo($('#top-nChk')), setRep = HC.odo($('#top-nRep'));

  // ---------- timeline ----------
  const T_B0 = 2.0, T_B1 = 8.6;          // the beam crosses the floor
  const DRIFT = 22;                       // rows flow toward the viewer, px per second
  const drift = t => t * DRIFT;
  const beamPos = t => PLANE * ease.inOut(seg(t, T_B0, T_B1));  // distance from the near edge
  const G = t => beamPos(t) + drift(t);   // a row is crossed once G passes its centre
  function crossAt(i) {
    const target = (i + 0.5) * RH;
    if (G(T_B1) < target) return Infinity;
    if (G(T_B0) >= target) return -Infinity;
    let a = T_B0, b = T_B1;
    for (let k = 0; k < 26; k++) { const m = (a + b) / 2; if (G(m) >= target) b = m; else a = m; }
    return b;
  }

  // ---------- rows ----------
  const slots = [];
  for (let k = 0; k < N; k++) {
    const el = document.createElement('div');
    el.className = 'r';
    el.innerHTML = '<span class="sku"></span><span class="pn"></span><span class="br"></span><span class="pl"></span><span class="was"></span><span class="pr"></span><span><span class="tag">Sony cost +6%</span></span><span class="st"></span>';
    rowsEl.appendChild(el);
    slots.push({ el, sku: el.children[0], pn: el.children[1], br: el.children[2], pl: el.children[3], was: el.children[4], pr: el.children[5], tag: el.querySelector('.tag'), st: el.children[7], idx: -1 });
  }
  // price as flip characters: each digit is a card that turns over to the new digit
  function fillPrice(sl, r) {
    // old and new prices padded to the same length, right-aligned, so $99.99 can become $104.99
    const n = r.sonara ? Math.max(money(r.price).length, money(r.newPrice).length) : 0;
    const a = money(r.price).padStart(n, ' '), b = r.sonara ? money(r.newPrice).padStart(n, ' ') : a;
    sl.pr.innerHTML = b.split('').map((c, k) => '<span class="ch' + (c === ',' || c === '.' ? ' sep' : c === '$' ? ' dl' : '') + '">' + a[k] + '</span>').join('');
    sl.chars = Array.from(sl.pr.children).map((el, k) => ({ el, from: a[k], to: b[k] }));
  }

  // ---------- ask any row why ----------
  const hero = root.querySelector('.hero'), card = $('#top-card');
  const T_LIVE = T_B0;   // rows answer as soon as the beam appears
  let ptr = null, hovSlot = null, hovIdx = -1, cv = 0, cx = 0, cy = 0;
  hero.addEventListener('pointermove', e => { ptr = { x: e.clientX, y: e.clientY }; });
  hero.addEventListener('pointerleave', () => { ptr = null; });
  // done: the beam has crossed this row. Before that, a row whose cost rose still carries its old price.
  function cardHTML(r, done) {
    const moved = r.sonara && done;
    const pct = Math.round((r.markup - 1) * 100), cost = moved ? r.newCost : r.cost, raw = Math.round(cost * r.markup * 100) / 100, price = moved ? r.newPrice : r.price;
    const li = (d, t, s, v, ok) => '<li' + (ok ? ' class="ok"' : '') + '><span class="d">' + d + '</span><span>' + t + '<span class="s">' + s + '</span></span><span class="v">' + v + '</span></li>';
    const ends = Math.abs(price - raw) > 0.004 ? 'Rounded up to .99' : 'Already ends in .99';
    return '<div class="hd"><div><b>' + r.name + (r.variant ? ' · ' + r.variant : '') + '</b><small>' + r.sku + '</small></div><div class="p">' + (moved ? '<s>' + money(r.price) + '</s>' : '') + money(price) + '</div></div><ol>' +
      (r.sonara && !done
        ? li('1', r.brand + ' raised its cost', 'New ' + r.brand + ' price list, 8:05 AM', '<s>' + money(r.cost) + '</s>' + money(r.newCost))
        : moved
        ? li('1', r.brand + ' raised its cost', 'New ' + r.brand + ' price list, 8:05 AM', '<s>' + money(r.cost) + '</s>' + money(r.newCost))
        : li('1', 'Your cost from ' + r.brand, 'Same as the last price list', money(r.cost))) +
      li('2', r.plan + ': cost plus ' + pct + '%', money(cost) + ' × ' + r.markup.toFixed(2), money(raw)) +
      li('3', 'Ends in .99', ends, money(price)) +
      (moved
        ? li('✓', 'Live in your store', 'Confirmed in Shopify', '8:06 AM', true)
        : r.sonara
        ? li('4', 'Updating now', 'New price from the new cost', money(HC.end99(r.newCost * r.markup)))
        : li('✓', 'Right where its rule puts it', done ? 'No change needed' : 'Checking now', 'No change', true)) +
      '</ol><div class="ft"><span>' + r.brand + ' · ' + r.plan + '</span><b>' + (moved ? 'Updated for the new cost' : r.sonara ? 'Updating' : done ? 'Checked 8:05 AM' : 'Checking') + '</b></div>';
  }

  let fw = 1760;
  function layout() {
    const phone = innerWidth <= 900;
    fw = phone ? Math.max(440, innerWidth * 1.12) : Math.max(1500, Math.min(2100, innerWidth * 1.22));
    floor.style.setProperty('--fw', fw + 'px');
    floor.style.setProperty('--tilt', phone ? '60deg' : '63deg');
  }

  // Hovering a row slows the floor to a crawl. The slowdown is kept as lag behind the
  // timeline drift, so with no hover (and in frozen frames) the floor is exactly drift(t).
  const CRAWL = 0.06;
  let lag = 0, k = 1, lastT = null;
  // drag or swipe the floor: an offset on top of the drift, with momentum after release
  const DRAG = 1.5;   // floor distance per screen pixel, for the tilt
  let user = 0, vel = 0, drag = null;
  const lineY = () => $('#top-hint').getBoundingClientRect().bottom + 8;
  hero.addEventListener('pointerdown', e => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('a, button') || e.clientY <= lineY()) return;
    drag = { y: e.clientY, at: performance.now() }; vel = 0;
    hero.setPointerCapture(e.pointerId); hero.classList.add('dragging');
  });
  hero.addEventListener('pointermove', e => {
    hero.classList.toggle('grab', !drag && e.clientY > lineY() && !e.target.closest('a, button'));
    if (!drag) return;
    const now = performance.now(), dy = (e.clientY - drag.y) * DRAG, dts = Math.max(0.001, (now - drag.at) / 1000);
    user += dy; vel = vel * 0.6 + (dy / dts) * 0.4; drag.y = e.clientY; drag.at = now;
  });
  const endDrag = () => { if (!drag) return; if (performance.now() - drag.at > 90) vel = 0; drag = null; hero.classList.remove('dragging'); };
  hero.addEventListener('pointerup', endDrag); hero.addEventListener('pointercancel', endDrag);
  const crossT = new Map();   // row index -> time the beam crossed it

  const words = root.querySelectorAll('[data-w]'), fades = root.querySelectorAll('[data-f]');
  function render(t) {
    if (lastT === null || t < lastT - 1e-6 || t - lastT > 0.5) { lag = 0; k = 1; user = 0; vel = 0; crossT.clear(); }
    const dq = HC.q.get('drag'); if (dq) user = +dq;   // probe: ?drag=-3000 pulls the floor back   // replay or scrub
    const dt = lastT === null ? 0 : clamp(t - lastT, 0, 0.1); lastT = t;
    k += ((hovSlot ? CRAWL : 1) - k) * (1 - Math.exp(-dt * 3.2));
    lag += (1 - k) * DRIFT * dt;
    if (!drag) { user += vel * dt; vel *= Math.exp(-3.5 * dt); if (Math.abs(vel) < 2) vel = 0; }
    words.forEach((el, k) => { const p = ease.out4(seg(t, 0.1 + k * 0.09, 1.0 + k * 0.09)); put(el, 'transform', `translateY(${(1 - p) * 40}px)`); put(el, 'opacity', p.toFixed(3)); });
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.5 + k * 0.12, 1.3 + k * 0.12)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${(1 - p) * 14}px)`); });

    // floor rises out of the dark
    put(floor, 'opacity', ease.out(seg(t, 0, 1.4)).toFixed(3));

    const d = drift(t) - lag + user, first = Math.floor(d / RH), B = beamPos(t);
    const beamY = PLANE - B;                               // in floor coordinates, top = far
    const sweeping = t > T_B0 - 0.2 && t < T_B1 + 0.6;
    put(beam, 'transform', `translateY(${beamY - 2}px)`);
    put(beam, 'opacity', (clamp(seg(t, T_B0 - 0.3, T_B0 + 0.2)) * (1 - seg(t, T_B1 - 0.4, T_B1 + 0.4))).toFixed(3));

    // an idle check pulse passes every nine seconds once the sweep is done
    const cp = t > T_B1 + 2 ? ((t - T_B1 - 2) % 9) / 3.2 : 2;
    const checkY = PLANE - PLANE * clamp(cp);
    put(check, 'transform', `translateY(${checkY}px)`);
    put(check, 'opacity', cp < 1 ? (Math.sin(cp * Math.PI) * 0.9).toFixed(3) : '0');

    let checked = 0;
    slots.forEach((sl, k) => {
      const i = first + k;
      sl.fresh = sl.idx !== i || !sl.r;
      if (sl.fresh) {
        sl.idx = i; const r = CAT[((i % CAT.length) + CAT.length) % CAT.length]; sl.r = r;
        sl.el.classList.toggle('son', r.sonara);
        sl.sku.textContent = r.sku; sl.pn.textContent = r.name + (r.variant ? ' · ' + r.variant : '');
        sl.br.textContent = r.brand; sl.pl.textContent = r.plan;
        sl.was.textContent = r.sonara ? money(r.price) : '';
        fillPrice(sl, r);
        sl.ct = crossAt(i);
        sl.tag.style.display = r.sonara ? '' : 'none';
        if (r.sonara) sl.tag.textContent = r.brand + ' cost +' + Math.round((r.rise - 1) * 100) + '%';
      }
      const y = PLANE - (i + 1) * RH + d;
      put(sl.el, 'transform', `translateY(${y.toFixed(1)}px)`);
      const r = sl.r;
      // after the sweep every row is settled, including rows arriving from the far end
      // the beam crosses a row once beam distance plus floor travel passes the row's centre
      let ct = crossT.get(i);
      if (ct === undefined && (t > T_B1 || B + d >= (i + 0.5) * RH)) {
        ct = lag === 0 && user === 0 ? (isFinite(sl.ct) ? sl.ct : -Infinity) : (sl.fresh ? -Infinity : t);
        crossT.set(i, ct);
      }
      const since = ct === undefined ? -99 : t - ct;
      sl.since = since;
      // light from the beam as it passes, and from the idle check pulse
      const lit = sweeping ? Math.max(0, 1 - Math.abs(y + RH / 2 - beamY) / 140) : 0;
      const clit = cp < 1 ? Math.max(0, 1 - Math.abs(y + RH / 2 - checkY) / 120) * 0.35 : 0;
      put(sl.el, '--lit', Math.max(lit, clit).toFixed(3));
      if (r.sonara) {
        // each character flips over in turn, from the dollar sign rightward
        sl.chars.forEach((c, n) => {
          const p = clamp((since - n * 0.05) / 0.32);
          const show = p >= 0.5 ? c.to : c.from;
          if (c.from !== c.to) { put(c.el, 'text', show); put(c.el, 'transform', `rotateX(${p < 1 && p > 0 ? (p < 0.5 ? -p * 180 : (1 - p) * 180) : 0}deg)`); }
        });
        const glow = since >= 0 ? 1 - ease.out(clamp(since / 1.6)) : 0;
        put(sl.el, '--pc', glow > 0.02 ? `color-mix(in srgb, #f39a66 ${Math.round(glow * 100)}%, #fff)` : '#fff');
        const tg = ease.out(clamp((since - 0.25) / 0.5));
        put(sl.tag, '--to', tg.toFixed(3)); put(sl.tag, '--tx', ((1 - tg) * 12).toFixed(1) + 'px');
        put(sl.was, '--wo', (ease.out(clamp((since - 0.15) / 0.5)) * 0.9).toFixed(3));
        put(sl.st, 'html', since >= 0.4 ? '<b>Confirmed</b> 8:06' : since >= 0 ? 'Sending' : '');
      } else {
        put(sl.st, 'html', since >= 0 ? 'No change' : '');
      }
    });

    // the row under the pointer, once the sweep is done
    // ?ptr=x,y points at the floor in a frozen frame, for checking the card without a mouse
    const probe = HC.q.get('ptr');
    if (probe) { const [px, py] = probe.split(',').map(Number); ptr = { x: px, y: py }; }
    const live = t >= T_LIVE && (probe || !document.documentElement.classList.contains('frozen'));
    put($('#top-hint'), 'opacity', ease.out(seg(t, T_LIVE, T_LIVE + 0.8)).toFixed(3));
    let hit = null;
    // hard line: only rows below the hint answer. The faint far rows behind the headline, buttons and tally never do.
    const line = $('#top-hint').getBoundingClientRect().bottom + 8;
    if (live && ptr && ptr.y > line && !drag) {
      const el = document.elementFromPoint(ptr.x, ptr.y); const rEl = el && el.closest('.r');
      const rr = rEl && rEl.getBoundingClientRect();
      hit = rEl && (rr.top + rr.bottom) / 2 > line ? slots.find(x => x.el === rEl) : null;
    }
    if (hovSlot && hovSlot !== hit) hovSlot.el.classList.remove('hov');
    if (hit) {
      hit.el.classList.add('hov');
      const done = hit.since >= 0, key = hit.idx + (done ? 'd' : 'w');
      if (key !== hovIdx) { hovIdx = key; card.innerHTML = cardHTML(hit.r, done); card.className = 'card' + (hit.r.sonara ? ' son' : ' still'); }
      const hr = hero.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
      // the card never covers the headline or the text under it
      const top = $('.hero .lede').getBoundingClientRect().bottom - hr.top + 14;
      const tx = clamp(ptr.x - hr.left + 22, 12, hr.width - w - 12), ty = clamp(ptr.y - hr.top - h - 22, top, hr.height - h - 12);
      cx = cv < 0.05 ? tx : lerp(cx, tx, 0.35); cy = cv < 0.05 ? ty : lerp(cy, ty, 0.35);
      if (probe) { cv = 0.99; cx = tx; cy = ty; }
    }
    hovSlot = hit;
    cv += ((hit ? 1 : 0) - cv) * 0.25;
    put(card, 'opacity', cv.toFixed(3));
    put(card, 'transform', `translate(${cx.toFixed(1)}px, ${(cy + (1 - cv) * 10).toFixed(1)}px) scale(${(0.96 + 0.04 * cv).toFixed(3)})`);

    // tallies follow the beam across the whole catalog
    const prog = ease.inOut(seg(t, T_B0, T_B1));
    setChk(14200 * prog); setRep(2319 * prog);
  }

  HC.run({ root, render, layout, duration: 12, name: 'B · The Board' });
})();
})(document.getElementById('top'));

/* ===== docs/design/section-concepts/02-why/why-data.js ===== */
/* Section 2 data: Northline Outfitters, an apparel store of 9,400 products, without StorePricer.
   Prices were set in a bulk edit on March 14. Vendors raised costs after that; the prices never followed.
   Product names are used for illustration; costs and prices are examples. */
window.WHY = (() => {
  const { makeStore, end99, round2, rng } = HC;
  const PLANS = {
    "Levi's": { plan: 'Denim plan', markup: 1.95 },
    Carhartt: { plan: 'Workwear plan', markup: 1.8 },
    Patagonia: { plan: 'Outerwear plan', markup: 1.9 },
    Columbia: { plan: 'Outerwear plan', markup: 1.85 },
    'New Balance': { plan: 'Footwear plan', markup: 1.75 },
  };
  const ITEMS = [
    ["Levi's", '501 Original Fit Jeans', 'LEV-501', ['32W 32L', '34W 32L', '36W 30L'], 40.77],
    ["Levi's", '505 Regular Fit Jeans', 'LEV-505', ['32W 32L', '34W 34L'], 35.40],
    ["Levi's", 'Trucker Jacket', 'LEV-TRK', ['M', 'L', 'XL'], 49.20],
    ["Levi's", 'Housemark Tee', 'LEV-TEE', ['S', 'M', 'L'], 12.80],
    ['Carhartt', 'K87 Pocket T-Shirt', 'CHT-K87', ['M', 'L', 'XL'], 12.20],
    ['Carhartt', 'Duck Active Jacket', 'CHT-J130', ['M', 'L', 'XL'], 83.30],
    ['Carhartt', 'Acrylic Watch Hat', 'CHT-A18', [''], 11.10],
    ['Carhartt', 'Double Front Work Pants', 'CHT-B01', ['32x30', '34x32'], 38.85],
    ['Patagonia', 'Better Sweater Fleece Jacket', 'PAT-BSW', ['S', 'M', 'L'], 78.90],
    ['Patagonia', 'Nano Puff Jacket', 'PAT-NANO', ['M', 'L'], 125.80],
    ['Patagonia', 'Baggies Shorts 5 in', 'PAT-BAG5', ['S', 'M', 'L'], 34.20],
    ['Patagonia', 'Synchilla Snap-T Pullover', 'PAT-SNPT', ['M', 'L'], 73.65],
    ['New Balance', '574 Core Sneakers', 'NB-574', ['9', '10', '11'], 51.40],
    ['New Balance', 'Fresh Foam X 880v14', 'NB-880', ['9', '10', '11'], 79.95],
    ['New Balance', '990v6 Sneakers', 'NB-990', ['9', '10'], 114.25],
    ['Columbia', 'Bugaboo II Interchange Jacket', 'COL-BUGA', ['M', 'L'], 108.10],
    ['Columbia', 'Steens Mountain Fleece', 'COL-STNS', ['M', 'L', 'XL'], 32.40],
    ['Columbia', 'PFG Tamiami II Shirt', 'COL-TAM2', ['M', 'L'], 24.30],
  ];
  const { catalog } = makeStore(ITEMS, PLANS, null, 1);
  const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // [month index, brand, cost rise, sender, attachment]
  const EVENTS = [
    [1, "Levi's", 0.04, 'Levi Strauss Wholesale', 'Spring wholesale prices.xlsx'],
    [3, 'Carhartt', 0.05, 'Carhartt Wholesale', 'Q3 price file.pdf'],
    [5, 'Patagonia', 0.06, 'Patagonia Dealer Services', 'Fall costs.xlsx'],
    [7, 'New Balance', 0.05, 'New Balance Wholesale', 'Cost update October.csv'],
    [8, 'Columbia', 0.04, 'Columbia Sportswear', 'Price increase notice.pdf'],
  ];
  // prices across the whole catalog that no longer match their costs, by month
  const STALE = [0, 755, 755, 1324, 1324, 2297, 2297, 3832, 4576, 4576];
  const PER_STALE_MONTH = 6.9;    // dollars of margin a stale price gives away in a month, on average
  const LOST = STALE.reduce((a, s, k) => (a.push((a[k - 1] || 0) + s * PER_STALE_MONTH), a), []);

  const EDITED = ['Mar 14 · bulk edit', 'Mar 14 · bulk edit', 'Mar 14 · bulk edit', 'Mar 14 · bulk edit', 'Jan 6 · CSV import', 'unknown', 'Nov 28 · sale', 'Feb 2 · by hand'];
  function rows(n, seed) {
    const r = rng(seed + 1);
    const seen = new Set();
    return catalog(n * 4, seed, 0.22).filter(x => !seen.has(x.name) && seen.add(x.name)).slice(0, n).map(x => {
      const cost0 = x.cost, ev = EVENTS.find(e => e[1] === x.brand);
      const edited = EDITED[Math.floor(r() * EDITED.length)];
      const sale = edited.includes('sale');
      const price = sale ? end99(cost0 * (1 + (x.markup - 1) * 0.55)) : end99(cost0 * x.markup);
      return Object.assign({}, x, {
        cost0, price, edited, sale, ev,
        costAt: m => (ev && m >= ev[0] ? round2(cost0 * (1 + ev[2])) : cost0),
        target: 1 - 1 / x.markup,
      });
    });
  }
  const margin = (row, m) => (row.price - row.costAt(m)) / row.price;
  // ok: where the rule would put it; thin: a point or three short; under: well short
  function health(row, m) {
    const gap = row.target - margin(row, m);
    return gap < 0.006 ? 'ok' : gap < 0.03 ? 'thin' : 'under';
  }
  return { MONTHS, MONTHS_LONG, EVENTS, STALE, LOST, rows, margin, health };
})();

/* ===== why ===== */
(function (root) {
(() => {
  const { seg, ease, clamp, lerp, money, put, fmt } = HC;
  const { MONTHS_LONG, EVENTS, STALE, rows, margin, health } = WHY;
  const $ = s => root.querySelector(s);
  const grid = $('#why-grid'), sheet = $('#why-sheet'), card = $('#why-card'), toasts = $('#why-toasts');
  const DATA = rows(14, 12);

  const R = DATA.map((d, k) => {
    const el = document.createElement('div');
    el.className = 'gr row';
    el.innerHTML = '<span>' + (k + 2) + '</span><span>' + d.name + (d.variant ? ' ' + d.variant : '') + '</span><span>' + d.brand + '</span><span>' + d.sku + '</span><span class="n cost"></span><span class="n price">' + d.price.toFixed(2) + '</span><span class="n mg"></span><span class="ed' + (d.sale ? ' sale' : '') + '">' + d.edited + '</span>';
    grid.appendChild(el);
    return { el, d, cost: el.querySelector('.cost'), price: el.querySelector('.price'), mg: el.querySelector('.mg') };
  });
  const setStale = HC.odo($('#why-stale'));

  // vendor emails, one per cost rise
  const T_M0 = 1.4, PER = 0.8;                 // month 0 is March; one month every 0.8s
  const monthAt = t => clamp(Math.floor((t - T_M0) / PER) + 1, 0, 9);
  const monthStart = m => T_M0 + (m - 1) * PER;
  const TO = EVENTS.map(([m, brand, pct, from, file]) => {
    const el = document.createElement('div'); el.className = 'toast';
    el.innerHTML = '<span class="av">' + from.split(' ').map(w => w[0]).join('').slice(0, 2) + '</span><div><span class="un">Unopened</span><b>' + from + '</b><span class="sub">New costs, up ' + Math.round(pct * 100) + '% from ' + MONTHS_LONG[m] + '</span><br><span class="att">' + file + '</span></div>';
    toasts.appendChild(el);
    return { el, at: monthStart(m) };
  });

  // ---------- ask a price why ----------
  const T_LIVE = 0.9;
  let ptr = null, hov = null, hovKey = null, cv = 0, cx = 0, cy = 0;
  sheet.addEventListener('pointermove', e => { ptr = { x: e.clientX, y: e.clientY }; });
  sheet.addEventListener('pointerleave', () => { ptr = null; });
  function cardHTML(x, m) {
    const d = x.d, h = health(d, m);
    return '<div class="hd2"><div><b>Why ' + money(d.price) + '?</b><small>' + d.name + (d.variant ? ' · ' + d.variant : '') + '</small></div><div class="p"></div></div><ol>' +
      '<li><span class="d"></span><span>Pricing rule</span><span class="v">None</span></li>' +
      '<li><span class="d"></span><span>Cost when it was priced</span><span class="v">Nobody wrote it down</span></li>' +
      '<li><span class="d"></span><span>Last changed by</span><span class="v">' + ({ 'bulk edit': 'A bulk edit', 'CSV import': 'A CSV import', 'sale': 'A sale nobody ended', 'by hand': 'Someone, by hand' }[d.edited.split(' · ')[1]] || 'No record') + '</span></li>' +
      '<li><span class="d"></span><span>Right for today’s cost?</span><span class="v' + (h === 'ok' ? '' : ' no') + '">' + (h === 'ok' ? 'Can’t tell' : 'No') + '</span></li>' +
      '</ol><div class="ft">The spreadsheet has the price. Not the reason.</div>';
  }

  const fades = root.querySelectorAll('[data-f]');
  function render(t) {
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.1 + k * 0.12, 0.9 + k * 0.12)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 16).toFixed(1)}px)`); });

    const m = monthAt(t), mp = clamp((t - T_M0) / PER + 1, 0, 9);
    put($('#why-mon'), 'text', m === 0 ? 'March 14' : MONTHS_LONG[m] + ' ' + (m === 9 ? 31 : 28));
    setStale(staleAt(mp));

    R.forEach(x => {
      const d = x.d, c = d.costAt(m), h = health(d, m);
      put(x.cost, 'text', c.toFixed(2));
      const bumped = d.ev && t >= monthStart(d.ev[0]) && t < monthStart(d.ev[0]) + 1.6;
      x.cost.classList.toggle('bump', !!bumped);
      put(x.mg, 'text', (margin(d, m) * 100).toFixed(1) + '%');
      put(x.mg, 'class', 'n mg ' + h);
    });

    // emails slide in, sit a moment, then stack away unopened
    TO.forEach((o, k) => {
      const a = ease.back(seg(t, o.at, o.at + 0.5), 1.2), out = ease.inOut(seg(t, o.at + 2.1, o.at + 2.6));
      put(o.el, 'transform', `translate(${((1 - a) * 60).toFixed(1)}px, ${(out * -14).toFixed(1)}px) scale(${(1 - out * 0.06).toFixed(3)})`);
      put(o.el, 'opacity', (clamp(seg(t, o.at, o.at + 0.25)) * (1 - out)).toFixed(3));
    });

    // pointing at a row
    const frozen = document.documentElement.classList.contains('frozen');
    const probe = HC.q.get('ptr');
    if (probe) { const [px, py] = probe.split(',').map(Number); ptr = { x: px, y: py }; cv = 0.99; }
    put($('#why-hint'), 'opacity', ease.out(seg(t, T_LIVE, T_LIVE + 0.6)).toFixed(3));
    let hit = null;
    if (t >= T_LIVE && ptr && (probe || !frozen)) { const el = document.elementFromPoint(ptr.x, ptr.y); const rEl = el && el.closest('.gr.row'); hit = rEl ? R.find(x => x.el === rEl) : null; }
    R.forEach(x => { x.el.classList.toggle('hov', x === hit); x.price.classList.toggle('sel', x === hit); });
    if (hit) {
      const key = hit.d.sku + m + health(hit.d, m);
      if (key !== hovKey) { hovKey = key; card.innerHTML = cardHTML(hit, m); }
      const sr = sheet.getBoundingClientRect(), pr = hit.price.getBoundingClientRect();
      const tx = clamp(pr.left - sr.left - card.offsetWidth - 16, 12, sr.width - card.offsetWidth - 12);
      const ty = clamp(pr.top - sr.top - 40, 54, sr.height - card.offsetHeight - 12);
      cx = cv < 0.05 ? tx : lerp(cx, tx, 0.35); cy = cv < 0.05 ? ty : lerp(cy, ty, 0.35);
    }
    hov = hit;
    cv += ((hit ? 1 : 0) - cv) * 0.25;
    put(card, 'opacity', cv.toFixed(3));
    put(card, 'transform', `translate(${cx.toFixed(1)}px, ${(cy + (1 - cv) * 8).toFixed(1)}px) scale(${(0.97 + 0.03 * cv).toFixed(3)})`);
  }
  // the stale count rolls up as each month begins
  function staleAt(mp) {
    const m = Math.min(9, Math.floor(mp));
    return m <= 0 ? 0 : lerp(STALE[m - 1], STALE[m], ease.inOut(clamp((mp - m) / 0.6)));
  }

  HC.run({ root, render, duration: 10, name: '2A · The Blank Answer' });
})();
})(document.getElementById('why'));

/* ===== docs/design/section-concepts/03-one-price/ladder-data.js ===== */
/* Section 3 data: the priority ladder at Treehouse Toys, a toy store of 6,800 products (the same
   store as section 7). Each product may be claimed by several tiers; the highest active claim sets its price.
   Product names are used for illustration; costs and prices are examples. */
window.LAD = (() => {
  const TIERS = [
    { id: 'fixed', n: 1, name: 'Fixed Price', what: 'A price you set by hand. Plans never change it.' },
    { id: 'custom', n: 2, name: 'Custom plans', what: 'Products you pick, like a clearance or a promotion.' },
    { id: 'shared', n: 3, name: 'Shared plans', what: 'Everyday pricing for a brand or category, like cost plus 40%.' },
    { id: 'base', n: 4, name: 'Baseline price', what: 'The price it had before StorePricer. Used when nothing else applies.' },
  ];
  // claims: fixed {price, by}, custom {plan, how, price}, shared {plan, how, price}, base {price, note}
  const P = (name, variant, sku, c) => ({ name, variant, sku, ...c });
  const clear = b => ({ plan: 'Clearance picks', how: '20% off the Baseline price', price: Math.round(b * 0.8 * 100) / 100 });
  const PRODUCTS = [
    P('LEGO Star Wars Millennium Falcon 75375', '', 'LEGO-75375', { fixed: { price: 79.99, by: 'Pinned by Maya Ruiz for the holidays' }, shared: { plan: 'Building sets plan', how: 'cost plus 20%', price: 82.99 }, base: { price: 84.99 } }),
    P('Barbie Dreamhouse', '', 'MAT-DREAM', { fixed: { price: 179.99, by: 'Pinned by Maya Ruiz' }, shared: { plan: 'Dolls plan', how: 'cost plus 45%', price: 189.99 }, base: { price: 199.99 } }),
    P('Hot Wheels Ultimate Garage', '', 'MAT-HWGAR', { fixed: { price: 119.99, by: 'Pinned by Jordan Lee' }, shared: { plan: 'Vehicles plan', how: 'cost plus 40%', price: 124.99 }, base: { price: 129.99 } }),
    P('Magna-Tiles Classic 100 Piece Set', '', 'MGT-100', { custom: clear(129.99), shared: { plan: 'Building sets plan', how: 'cost plus 20%', price: 126.99 }, base: { price: 129.99 } }),
    P('Melissa & Doug Wooden Railway Set', '', 'MND-RAIL', { custom: clear(69.99), shared: { plan: 'Wooden toys plan', how: 'cost plus 50%', price: 66.99 }, base: { price: 69.99 } }),
    P('Jellycat Bashful Bunny', 'Beige', 'JC-BBUN-BGE', { custom: clear(24.99), shared: { plan: 'Plush plan', how: 'cost plus 55%', price: 23.99 }, base: { price: 24.99 } }),
    P('UNO Card Game', '', 'MAT-UNO', { custom: clear(9.99), base: { price: 9.99, note: 'No cost on file, so no markup can apply' } }),
    P('LEGO Icons Orchid 10311', '', 'LEGO-10311', { shared: { plan: 'Building sets plan', how: 'cost plus 20%', price: 52.99 }, base: { price: 49.99 } }),
    P('Monopoly Classic Board Game', '', 'HAS-MONO', { shared: { plan: 'Games plan', how: 'cost plus 45%', price: 21.99 }, base: { price: 19.99 } }),
    P('Hot Wheels 20 Car Gift Pack', '', 'MAT-HW20', { shared: { plan: 'Vehicles plan', how: 'cost plus 40%', price: 25.99 }, base: { price: 26.99 } }),
    P('Barbie Fashionistas Doll', '', 'MAT-FASH', { shared: { plan: 'Dolls plan', how: 'cost plus 45%', price: 11.99 }, base: { price: 10.99 } }),
    P('Crayola Inspiration Art Case', '', 'CRA-ART', { shared: { plan: 'Arts and crafts plan', how: 'cost plus 45%', price: 26.99 }, base: { price: 24.99 } }),
    P('Nerf Elite 2.0 Commander', '', 'HAS-NERF', { shared: { plan: 'Outdoor plan', how: 'cost plus 40%', price: 16.99 }, base: { price: 15.99 } }),
    P('Paw Patrol Lookout Tower', '', 'SPM-PAWT', { shared: { plan: 'Figures plan', how: 'cost plus 45%', price: 64.99 }, base: { price: 59.99 } }),
    P('Squishmallows Cam the Cat 8 in', '', 'SQM-CAM8', { base: { price: 12.99, note: 'Not in any plan yet' } }),
    P('Squishmallows Wendy the Frog 12 in', '', 'SQM-WND12', { base: { price: 19.99, note: 'Not in any plan yet' } }),
    P("Rubik's Cube 3x3", '', 'SPM-RUBIK', { base: { price: 10.99, note: 'No cost on file, so no markup can apply' } }),
  ];
  // The whole catalog by which tiers claim each product (sums to 6,800)
  const GROUPS = [
    { f: 1, c: 1, s: 1, n: 4 }, { f: 1, c: 0, s: 1, n: 18 }, { f: 1, c: 0, s: 0, n: 6 },
    { f: 0, c: 1, s: 1, n: 420 }, { f: 0, c: 1, s: 0, n: 140 },
    { f: 0, c: 0, s: 1, n: 5480 }, { f: 0, c: 0, s: 0, n: 732 },
  ];
  // the winning tier for a product, given which tiers are switched on
  function winner(p, on) {
    if (on.fixed && p.fixed) return 'fixed';
    if (on.custom && p.custom) return 'custom';
    if (on.shared && p.shared) return 'shared';
    return 'base';
  }
  const priceOf = (p, tier) => (tier === 'base' ? p.base.price : p[tier].price);
  function counts(on) {
    const c = { fixed: 0, custom: 0, shared: 0, base: 0 };
    GROUPS.forEach(g => { const t = on.fixed && g.f ? 'fixed' : on.custom && g.c ? 'custom' : on.shared && g.s ? 'shared' : 'base'; c[t] += g.n; });
    return c;
  }
  const label = (p, tier) => (tier === 'fixed' ? p.fixed.by : tier === 'base' ? (p.base.note || 'The price it already had') : p[tier].plan + ' · ' + p[tier].how);
  return { TIERS, PRODUCTS, GROUPS, winner, priceOf, counts, label };
})();

/* ===== ranking ===== */
(function (root) {
(() => {
  const { seg, ease, clamp, money, put, end99 } = HC;
  const { TIERS, PRODUCTS, winner, priceOf, counts, label } = LAD;
  const $ = s => root.querySelector(s);
  const stage = $('#ranking-stage'), claims = $('#ranking-claims'), priceEl = $('#ranking-price');

  // ---------- state ----------
  let pi = 5, on = { fixed: true, custom: true, shared: true, base: true }, pinned = {}, touched = false;
  const product = () => { const p = PRODUCTS[pi]; return pinned[pi] ? Object.assign({}, p, { fixed: { price: pinned[pi], by: 'Pinned by you, just now' } }) : p; };
  const pinPrice = p => end99(p.base.price * 0.92);

  const CM = {};
  TIERS.forEach(t => {
    const el = document.createElement('div'); el.className = 'cm';
    el.innerHTML = '<span class="rn">' + t.n + '</span><div><b>' + t.name + '</b><span class="why"></span><span class="st"></span></div><div class="rt"><span class="v num"></span><span class="ctl"></span></div>';
    claims.appendChild(el);
    CM[t.id] = { el, why: el.querySelector('.why'), st: el.querySelector('.st'), v: el.querySelector('.v'), ctl: el.querySelector('.ctl') };
  });
  function controls() {
    const p = product();
    CM.custom.ctl.innerHTML = PRODUCTS[pi].custom ? '<button class="sw" role="switch" aria-checked="' + on.custom + '"><i></i>' + (on.custom ? 'On' : 'Off') + '</button>' : '';
    CM.shared.ctl.innerHTML = PRODUCTS[pi].shared ? '<button class="sw" role="switch" aria-checked="' + on.shared + '"><i></i>' + (on.shared ? 'On' : 'Off') + '</button>' : '';
    CM.fixed.ctl.innerHTML = PRODUCTS[pi].fixed ? '<button class="sw" role="switch" aria-checked="' + on.fixed + '"><i></i>' + (on.fixed ? 'On' : 'Off') + '</button>' : '<button class="pin' + (pinned[pi] ? ' on' : '') + '">' + (pinned[pi] ? 'Unpin' : 'Pin ' + money(pinPrice(p))) + '</button>';
    CM.base.ctl.innerHTML = '';
    ['fixed', 'custom', 'shared'].forEach(id => { const b = CM[id].ctl.querySelector('.sw'); if (b) b.onclick = () => { touched = true; on[id] = !on[id]; update(true); }; });
    const pb = CM.fixed.ctl.querySelector('.pin'); if (pb) pb.onclick = () => { touched = true; if (pinned[pi]) delete pinned[pi]; else pinned[pi] = pinPrice(PRODUCTS[pi]); update(true); };
  }

  let shownPrice = null, w = null, curT = 0;
  function update(animate) {
    const p = product(), win = winner(p, on);
    controls();
    TIERS.forEach(t => {
      const c = CM[t.id], has = t.id === 'base' || !!p[t.id];
      c.el.className = 'cm' + (!has ? ' none' : t.id === win ? ' win' : !on[t.id] ? ' off lose' : ' lose');
      c.v.textContent = has ? money(priceOf(p, t.id)) : 'Does not apply';
      c.why.textContent = has ? label(p, t.id) : t.id === 'fixed' ? 'Nobody has pinned this price' : t.id === 'custom' ? 'Not in a hand-picked plan' : 'No everyday plan covers it';
      c.st.textContent = !has ? '' : t.id === win ? 'Sets the price' : !on[t.id] ? 'Turned off' : TIERS.findIndex(x => x.id === t.id) < TIERS.findIndex(x => x.id === win) ? '' : 'Not used. A higher one applies';
    });
    $('#ranking-nm').textContent = p.name; $('#ranking-meta').innerHTML = (p.variant ? p.variant + ' · ' : '') + '<span class="sku">' + p.sku + '</span>';
    const tier = TIERS.find(t => t.id === win);
    $('#ranking-by').innerHTML = 'Set by <b>' + tier.name + '</b>' + (win === 'base' ? '' : ' · ' + label(p, win));
    const np = money(priceOf(p, win));
    if (np !== shownPrice) {
      const sp = priceEl.firstChild;
      if (animate && shownPrice) {
        const old = sp.cloneNode(true); old.style.position = 'absolute'; priceEl.style.position = 'relative'; priceEl.appendChild(old);
        sp.textContent = np;
        old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => old.remove();
        sp.animate([{ transform: 'translateY(100%)', color: '#8f4c25' }, { transform: 'none', color: '#8f4c25', offset: .6 }, { color: '#00322f' }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else sp.textContent = np;
      shownPrice = np;
    }
    if (win !== w) { w = win; wireAt = curT; }
    root.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', +b.dataset.p === pi));
  }
  root.querySelectorAll('.chip').forEach(b => b.onclick = () => { touched = true; pi = +b.dataset.p; on = { fixed: true, custom: true, shared: true, base: true }; update(true); });

  // ---------- the copper wire from the winning claim to the price ----------
  let wireAt = 0;
  function wire(t) {
    const sr = stage.getBoundingClientRect(), a = CM[w].el.getBoundingClientRect(), b = $('#ranking-tag').getBoundingClientRect();
    const x0 = a.right - sr.left, y0 = a.top + a.height / 2 - sr.top, x1 = b.left - sr.left, y1 = b.top + b.height * 0.55 - sr.top;
    const mx = (x0 + x1) / 2;
    const d = `M${x0} ${y0} C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
    const wp = $('#ranking-wp'); wp.setAttribute('d', d);
    const len = wp.getTotalLength(), p = ease.inOut(clamp((t - wireAt) / 0.55));
    wp.style.strokeDasharray = len; wp.style.strokeDashoffset = (len * (1 - p)).toFixed(1);
    $('#ranking-w0').setAttribute('cx', x0); $('#ranking-w0').setAttribute('cy', y0);
    $('#ranking-w1').setAttribute('cx', x1); $('#ranking-w1').setAttribute('cy', y1); $('#ranking-w1').style.opacity = p > 0.95 ? 1 : 0;
  }

  const setC = {}; root.querySelectorAll('[data-c]').forEach(el => setC[el.dataset.c] = HC.odo(el));
  const fades = root.querySelectorAll('[data-f]');
  update(false);
  function render(t) {
    curT = t;
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.05 + k * 0.1, 0.8 + k * 0.1)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 14).toFixed(1)}px)`); });
    // the demonstration: switch Custom off, then pin a price, then put it back
    if (!touched) {
      const wantCustom = !(t >= 3.4 && t < 8.2), wantPin = t >= 5.6 && t < 8.2;
      if (pi !== 5 || on.custom !== wantCustom || !!pinned[5] !== wantPin) {
        pi = 5; on.custom = wantCustom; if (wantPin) pinned[5] = pinPrice(PRODUCTS[5]); else delete pinned[5];
        update(!document.documentElement.classList.contains('frozen'));
      }
    }
    wire(document.documentElement.classList.contains('frozen') ? 99 : t);
    const c = counts({ fixed: true, custom: true, shared: true, base: true }), f = ease.out(seg(t, 0.8, 2.2));
    Object.keys(setC).forEach(k => setC[k](c[k] * f));
    put($('#ranking-hint'), 'opacity', ease.out(seg(t, 1, 1.6)).toFixed(3));
  }
  HC.run({ root, render, duration: 10, name: '3C · Four Claims' });
})();
})(document.getElementById('ranking'));

/* ===== docs/design/section-concepts/04-preview/plan-data.js ===== */
/* Section 4 data: the new Holiday Audio plan, previewed before it prices anything.
   Holiday Audio: a Shared plan for Sony headphones, earbuds and portable speakers,
   priced at cost plus a markup and rounded to an ending. Today those products sit on the
   Audio plan (cost plus 38%, ending in .99). */
window.PLAN = (() => {
  const { rng, round2, SONARA, money } = HC;
  const TYPES = [
    { id: 'hp', name: 'Headphones', products: 136, prices: 520 },
    { id: 'eb', name: 'Earbuds', products: 104, prices: 410 },
    { id: 'sp', name: 'Portable speakers', products: 78, prices: 274 },
  ];
  const ENDINGS = [
    { id: '99', name: '.99', f: x => { const c = Math.round(x * 100); return Math.ceil((c - 99) / 100) + 0.99; } },
    { id: '95', name: '.95', f: x => { const c = Math.round(x * 100); return Math.ceil((c - 95) / 100) + 0.95; } },
    { id: '00', name: 'Whole dollars', f: x => Math.ceil(Math.round(x * 100) / 100) },
  ];
  const current = cost => ENDINGS[0].f(cost * 1.38);

  // every price the plan would touch, with a deterministic spread of costs
  const r = rng(404);
  const RANGE = { hp: [38, 190], eb: [18, 110], sp: [26, 170] };
  const POP = [];
  TYPES.forEach(t => { for (let k = 0; k < t.prices; k++) { const [a, b] = RANGE[t.id]; POP.push({ type: t.id, cost: round2(a + (b - a) * Math.pow(r(), 1.6)) }); } });

  // the products shown by name
  const TYPE_OF = { 'WH-1000XM4 Wireless Headphones': 'hp', 'WH-CH720N Wireless Headphones': 'hp', 'WH-CH520 Wireless Headphones': 'hp', 'WF-C700N Wireless Earbuds': 'eb', 'WF-1000XM5 Earbuds': 'eb', 'WF-C510 Earbuds': 'eb', 'SRS-XB100 Portable Speaker': 'sp', 'SRS-XE300 Portable Speaker': 'sp', 'SRS-XE200 Portable Speaker': 'sp' };
  const SHOWN = SONARA.filter(s => TYPE_OF[s.product]).map(s => ({ name: s.name, product: s.product, variant: s.variant, sku: s.sku, type: TYPE_OF[s.product], cost: s.newCost, now: current(s.newCost) }));

  function preview(markup, ending, types) {
    const end = ENDINGS.find(e => e.id === ending).f;
    let n = 0, down = 0, up = 0, same = 0, sum = 0, products = 0;
    TYPES.forEach(t => { if (types[t.id]) products += t.products; });
    POP.forEach(p => {
      if (!types[p.type]) return;
      const now = current(p.cost), next = end(p.cost * (1 + markup / 100));
      n++; sum += (next - now) / now;
      if (Math.abs(next - now) < 0.005) same++; else if (next < now) down++; else up++;
    });
    return { n, down, up, same, products, avg: n ? sum / n : 0 };
  }
  // names for every previewed price, so any group of them can be listed legibly
  // names by type and price band, kept apart from the products named elsewhere on the page
  const NAMES = {
    hp: [['MDR-ZX310AP Headphones', 'WH-CH510 Headphones'], ['WH-CH710N Headphones', 'MDR-7520 Headphones'], ['WH-XB910N Headphones', 'ULT Wear Headphones', 'WH-1000XM3 Headphones']],
    eb: [['WF-C500 Earbuds', 'WI-C100 Earbuds'], ['WF-SP800N Earbuds', 'LinkBuds Open Earbuds'], ['WF-1000XM4 Earbuds', 'LinkBuds Fit Earbuds']],
    sp: [['SRS-XB13 Speaker', 'SRS-XB12 Speaker'], ['SRS-XB23 Speaker', 'SRS-XB33 Speaker'], ['SRS-XB43 Speaker', 'SRS-XP500 Speaker']],
  };
  const TONES = ['Black', 'Silver', 'White', 'Blue', 'Midnight Blue', 'Gray', 'Beige', 'Orange', 'Taupe', 'Pink'];
  POP.forEach((p, k) => { const band = p.cost < 60 ? 0 : p.cost < 120 ? 1 : 2, n = NAMES[p.type][band]; p.name = 'Sony ' + n[k % n.length]; p.variant = TONES[(k * 7) % TONES.length]; });
  const BUCKETS = [
    { id: 'd20', name: 'Down more than $20', test: d => d <= -20 },
    { id: 'd10', name: 'Down $10 to $20', test: d => d > -20 && d <= -10 },
    { id: 'd5', name: 'Down $5 to $10', test: d => d > -10 && d <= -5 },
    { id: 'd1', name: 'Down $1 to $5', test: d => d > -5 && d <= -1 },
    { id: 'd0', name: 'Down less than $1', test: d => d > -1 && d < -0.005 },
    { id: 'eq', name: 'No change', test: d => Math.abs(d) <= 0.005 },
    { id: 'up', name: 'Going up', test: d => d > 0.005 },
  ];
  function buckets(markup, ending, types) {
    const end = ENDINGS.find(e => e.id === ending).f;
    const out = BUCKETS.map(b => ({ ...b, n: 0, rows: [] }));
    POP.forEach(p => {
      if (types && !types[p.type]) return;
      const now = current(p.cost), next = end(p.cost * (1 + markup / 100)), d = next - now;
      const b = out.find(x => x.test(d)); b.n++; if (b.rows.length < 6) b.rows.push({ name: p.name, variant: p.variant, now, next, d });
    });
    return out;
  }
  const priceFor = (row, markup, ending) => ENDINGS.find(e => e.id === ending).f(row.cost * (1 + markup / 100));
  return { TYPES, ENDINGS, SHOWN, preview, priceFor, current, money, buckets };
})();

/* ===== preview ===== */
(function (root) {
(() => {
  const { seg, ease, clamp, put, money, fmt } = HC;
  const { TYPES, ENDINGS, SHOWN, preview, priceFor } = PLAN;
  const $ = s => root.querySelector(s);

  let st = { markup: 38, ending: '99', types: { hp: true, eb: true, sp: true } }, touched = false;
  const touch = () => { touched = true; };

  TYPES.forEach(t => {
    const b = document.createElement('button'); b.className = 'tc'; b.type = 'button';
    b.innerHTML = t.name + '<span>' + t.products + '</span>';
    b.onclick = () => { touch(); st.types[t.id] = !st.types[t.id]; if (!Object.values(st.types).some(Boolean)) st.types[t.id] = true; draw(true); };
    $('#preview-types').appendChild(b); t.btn = b;
  });
  ENDINGS.forEach(e => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = e.name;
    b.onclick = () => { touch(); st.ending = e.id; draw(true); };
    $('#preview-ends').appendChild(b); e.btn = b;
  });
  $('#preview-mk').addEventListener('input', e => { touch(); st.markup = +e.target.value; draw(true); });
  $('#preview-send').onclick = () => { touch(); $('#preview-send').textContent = 'Sent to Jordan Lee'; $('#preview-send').disabled = true; };

  const seenP = new Set();
  const R = SHOWN.filter(s => !seenP.has(s.product) && seenP.add(s.product)).map(s => {
    const el = document.createElement('div'); el.className = 'tr';
    el.innerHTML = '<span class="pn">' + s.product + '<small>' + (s.variant || s.sku) + '</small></span><span class="now">' + money(s.now) + '</span><span class="nx"><span></span></span><span class="ch"></span>';
    $('#preview-rows').appendChild(el);
    return { s, el, nx: el.querySelector('.nx span'), ch: el.querySelector('.ch'), last: null };
  });

  const odo = {}; ['nPr', 'nPd', 'nDn', 'nUp', 'nEq'].forEach(id => odo[id] = HC.odo($('#preview-' + id)));
  const shown = { nPr: 0, nPd: 0, nDn: 0, nUp: 0, nEq: 0, avg: 0 };
  let goal = null;
  function draw(animate) {
    goal = preview(st.markup, st.ending, st.types);
    TYPES.forEach(t => t.btn.setAttribute('aria-pressed', st.types[t.id]));
    ENDINGS.forEach(e => e.btn.setAttribute('aria-pressed', st.ending === e.id));
    $('#preview-mk').value = st.markup; put($('#preview-mkv'), 'text', st.markup + '%');
    let vis = 0;
    R.forEach(x => {
      const on = st.types[x.s.type] && vis < 8; if (on) vis++;
      x.el.classList.toggle('hide', !on);
      const p = priceFor(x.s, st.markup, st.ending), d = p - x.s.now, txt = money(p);
      if (txt !== x.last) {
        x.nx.textContent = txt;
        if (animate && x.last) x.nx.animate([{ transform: 'translateY(70%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
        x.last = txt;
      }
      x.ch.className = 'ch ' + (Math.abs(d) < 0.005 ? 'eq' : d < 0 ? 'dn' : 'up');
      x.ch.textContent = Math.abs(d) < 0.005 ? 'No change' : (d < 0 ? '−' : '+') + money(Math.abs(d)) + '  ' + (d < 0 ? '−' : '+') + Math.abs(d / x.s.now * 100).toFixed(1) + '%';
    });
  }
  draw(false);

  const fades = root.querySelectorAll('[data-f]');
  function render(t) {
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.05 + k * 0.1, 0.8 + k * 0.1)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 14).toFixed(1)}px)`); });
    // the demonstration: the markup slides from today's 38% down to 30%
    if (!touched) {
      const m = Math.round(38 - 8 * ease.inOut(seg(t, 1.8, 3.8)));
      if (m !== st.markup) { st.markup = m; draw(!document.documentElement.classList.contains('frozen')); }
    }
    const frozen = document.documentElement.classList.contains('frozen');
    const map = { nPr: goal.n, nPd: goal.products, nDn: goal.down, nUp: goal.up, nEq: goal.same };
    const intro = ease.out(seg(t, 0.5, 1.6));
    Object.keys(map).forEach(k => { const target = map[k] * intro; shown[k] = frozen || t < 1.7 ? target : shown[k] + (target - shown[k]) * 0.2; odo[k](shown[k]); });
    shown.avg = frozen ? goal.avg : shown.avg + (goal.avg - shown.avg) * 0.2;
    put($('#preview-nAv'), 'text', (Math.abs(shown.avg) < 0.0005 ? '0.0' : (shown.avg < 0 ? '−' : '+') + Math.abs(shown.avg * 100).toFixed(1)) + '%');
    put($('#preview-hint'), 'opacity', ease.out(seg(t, 1, 1.6)).toFixed(3));
  }
  HC.run({ root, render, duration: 8, name: '4A · The Live Rule' });
})();
})(document.getElementById('preview'));

/* ===== docs/design/section-concepts/04b-app/tour-data.js ===== */
/* Section 4b data: the real app screens, in the order of one week's work, with the notes
   pinned to each. Pin positions are percentages of the screen image (1920 by 1200). */
window.TOUR = [
  { id: 'dashboard', tab: 'Dashboard', title: 'Start every day with what needs you', img: 'dashboard.webp',
    pins: [
      { x: 16, y: 50, t: '12,848 of 14,200 products are priced by a plan. The rest hold their Baseline price.' },
      { x: 52, y: 47, t: '44 need you: 3 were changed directly in Shopify and 41 have no cost on file.' },
      { x: 67, y: 78, t: '99.7% of products have a cost on file, so markups can apply.' },
    ] },
  { id: 'newreview', tab: 'New plan', title: 'Check a new plan before it changes a single price', img: 'newreview.webp',
    pins: [
      { x: 16.4, y: 27, t: 'Nothing is priced until the plan is approved.' },
      { x: 89, y: 40, t: '1,204 prices would change. All of them go down.' },
      { x: 31, y: 62, t: 'The rule: vendor cost plus 30%, ending in .99.' },
      { x: 84, y: 95, t: 'Every product with its cost, today’s price and the plan’s price.' },
    ] },
  { id: 'approvals', tab: 'Approvals', title: 'Approve new plans in one place', img: 'approvals.webp',
    pins: [
      { x: 20, y: 25, t: 'Two new plans are waiting. New costs never wait here: prices follow them automatically.' },
      { x: 93, y: 44, t: 'Open a plan to check every price. Then approve or reject it.' },
      { x: 30, y: 78, t: 'Every approval is recorded with who approved it and when.' },
    ] },
  { id: 'queued', tab: 'Queued prices', title: 'Watch approved prices go live', img: 'queued.webp',
    pins: [
      { x: 30, y: 21, t: 'Jordan Lee approved Holiday Audio. Its prices go live on the next update. Or right away with Run Now.' },
      { x: 20, y: 37, t: '1,204 prices waiting to be sent to Shopify.' },
      { x: 93, y: 67, t: 'You can hold back any single price before it goes live.' },
    ] },
  { id: 'update-automatic', tab: 'Price Update', title: 'Get a receipt for every update', img: 'update-automatic.webp',
    pins: [
      { x: 44, y: 12, t: 'Sony raised its costs 6%. 2,318 prices updated automatically. No approval needed.' },
      { x: 22, y: 27, t: 'Confirmed: every new price is live in Shopify.' },
      { x: 56, y: 50, t: 'What each price was and what it is now.' },
    ] },
  { id: 'history', tab: 'Price History', title: 'Every change on record', img: 'history.webp',
    pins: [
      { x: 54, y: 22, t: 'Filter by price changes, new costs, plan changes and more.' },
      { x: 62, y: 37, t: 'Prices changed directly in Shopify are held for your review. Never overwritten.' },
      { x: 42, y: 95, t: 'New costs are recorded too.' },
    ] },
  { id: 'addons', tab: 'Option add-ons', title: 'Price options once', img: 'addons.webp',
    pins: [
      { x: 18, y: 64, t: 'Set what each option adds: a mount, a protection plan.' },
      { x: 68, y: 53, t: 'See every combination it affects before you save.' },
    ] },
  { id: 'undo', tab: 'Undo', title: 'Undo any change', img: 'undo.webp',
    pins: [
      { x: 74, y: 45, t: 'Undo a change from the plan’s history. The markup goes back to 30% and 1,204 prices change back.' },
    ] },
];

/* ===== how ===== */
(function (root) {
(() => {
  const { seg, ease, clamp, put } = HC;
  const $ = s => root.querySelector(s);
  const IMG = 'assets/img/screens/';
  const N = TOUR.length, CW = 628;   // card width plus gap

  // two copies of the week, so the strip can drift forever
  for (let r = 0; r < 2; r++) TOUR.forEach((s, k) => {
    const b = document.createElement('button'); b.className = 'card'; b.type = 'button';
    b.innerHTML = '<div class="im"><img src="' + IMG + s.img + '" alt="' + s.title + '" loading="eager"></div><div class="t"><b>' + String(k + 1).padStart(2, '0') + '</b><span>' + s.title + '</span></div><div class="d">' + s.pins[0].t + '</div>';
    b.onclick = () => { if (moved < 8) open(k); };
    if (r) b.setAttribute('aria-hidden', 'true'), b.tabIndex = -1;
    $('#how-track').appendChild(b);
  });

  let cur = -1;
  function open(k) {
    cur = (k + N) % N; const s = TOUR[cur];
    $('#how-lbi').innerHTML = '<img src="' + IMG + s.img + '" alt="' + s.title + '">' + s.pins.map((p, j) => '<span class="pin" style="left:' + p.x + '%;top:' + p.y + '%">' + (j + 1) + '</span>').join('');
    $('#how-side').innerHTML = '<div class="n">' + String(cur + 1).padStart(2, '0') + ' of ' + N + ' · ' + s.tab + '</div><h3>' + s.title + '</h3><ol>' + s.pins.map((p, j) => '<li><b>' + (j + 1) + '</b><span>' + p.t + '</span></li>').join('') + '</ol><div class="nav2"><button type="button" data-d="-1">Previous</button><button type="button" data-d="1">Next</button><button type="button" data-x>Close</button></div>';
    $('#how-side').querySelectorAll('[data-d]').forEach(b => b.onclick = () => open(cur + +b.dataset.d));
    $('#how-side').querySelector('[data-x]').onclick = close;
    $('#how-lb').classList.add('on');
  }
  function close() { $('#how-lb').classList.remove('on'); cur = -1; }
  $('#how-lb').addEventListener('click', e => { if (e.target.id === 'lb') close(); });
  addEventListener('keydown', e => { if (cur < 0) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') open(cur + 1); if (e.key === 'ArrowLeft') open(cur - 1); });
  const probe = HC.q.get('open'); if (probe != null) open(+probe);

  // the strip drifts; pointing at it eases the drift to a crawl. Drag or swipe to move it
  // yourself; it keeps some momentum when let go. A drag never opens a screen.
  let x = 0, speed = 1, last = null, hover = false, drag = false, vel = 0, moved = 0, px = 0, pt = 0;
  const strip = $('#how-strip');
  strip.addEventListener('pointerenter', () => { hover = true; });
  strip.addEventListener('pointerleave', () => { hover = false; });
  strip.addEventListener('pointerdown', e => { drag = true; moved = 0; vel = 0; px = e.clientX; pt = performance.now(); });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const now = performance.now(), dx = e.clientX - px;
    moved += Math.abs(dx);
    if (moved > 8 && !strip.classList.contains('drag')) { strip.classList.add('drag'); try { strip.setPointerCapture(e.pointerId); } catch (_) {} }
    x -= dx; vel = -dx / Math.max(1, now - pt) * 1000; px = e.clientX; pt = now;
  });
  const end = () => { if (!drag) return; drag = false; strip.classList.remove('drag'); if (performance.now() - pt > 90) vel = 0; };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  // sideways trackpad or shift plus wheel
  strip.addEventListener('wheel', e => { const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0; if (d) { x += d; e.preventDefault(); } }, { passive: false });
  // arrow keys move the strip when a card has focus
  $('#how-track').addEventListener('keydown', e => { if (cur >= 0) return; if (e.key === 'ArrowRight') { vel = 1400; e.preventDefault(); } if (e.key === 'ArrowLeft') { vel = -1400; e.preventDefault(); } });
  const fades = root.querySelectorAll('[data-f]');
  function render(t) {
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.05 + k * 0.1, 0.8 + k * 0.1)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 14).toFixed(1)}px)`); });
    const frozen = document.documentElement.classList.contains('frozen');
    const dt = last == null ? 0 : clamp(t - last, 0, 0.1); last = t;
    speed += ((hover || cur >= 0 || drag ? 0.06 : 1) - speed) * (1 - Math.exp(-dt * 3.2));
    if (frozen) x = t * 38;
    else if (!drag) { x += (38 * speed + vel) * dt; vel *= Math.exp(-dt * 3.5); if (Math.abs(vel) < 4) vel = 0; }
    // the track holds the week twice; keep a full copy spanning the screen at all times
    const L = N * CW;
    put($('#how-track'), 'transform', `translateX(${(-(((x % L) + L) % L) - 300).toFixed(1)}px)`);
  }
  HC.run({ root, render, duration: 20, name: '4bC · The Contact Sheet' });
})();
})(document.getElementById('how'));

/* ===== docs/design/section-concepts/05-run/run-data.js ===== */
/* Section 5 data: Holiday Audio's day, October 7. Approved by Jordan Lee, sent, confirmed,
   then edited from 30% to 25% and undone back to 30% from the plan's history. */
window.RUN = (() => {
  const { SONARA, end99, money } = HC;
  const pick = (name, v) => SONARA.find(r => r.name === name && (v == null || r.variant === v));
  const ROWS = [
    pick('Sony WH-1000XM4 Wireless Headphones', 'Black'), pick('Sony WF-C700N Wireless Earbuds', 'White'),
    pick('Sony WF-1000XM5 Earbuds', 'Black'), pick('Sony SRS-XB100 Portable Speaker', 'Blue'),
    pick('Sony SRS-XE300 Portable Speaker', 'Black'), pick('Sony WF-C510 Earbuds', 'Blue'),
  ].map(r => ({ name: r.name.replace('Sony ', ''), variant: r.variant, before: r.newPrice, at: m => end99(r.newCost * (1 + m / 100)) }));
  // the day, in minutes after midnight
  const EVENTS = [
    { t: 542, time: '9:02 AM', who: 'Jordan Lee', what: 'Approved Holiday Audio', detail: 'Cost plus 30%. 1,204 prices across 318 products.', kind: 'approve' },
    { t: 543, time: '9:03 AM', who: 'StorePricer', what: 'Sent 1,204 prices to Shopify', detail: 'All together, in one update.', kind: 'send' },
    { t: 545, time: '9:05 AM', who: 'StorePricer', what: 'Receipt: all 1,204 confirmed', detail: 'Every new price confirmed live in Shopify.', kind: 'receipt' },
    { t: 690, time: '11:30 AM', who: 'Maya Ruiz', what: 'Edited the markup to 25%', detail: '1,204 prices sent and confirmed at the new markup.', kind: 'edit' },
    { t: 701, time: '11:41 AM', who: 'Maya Ruiz', what: 'Undid the edit', detail: 'Markup back to 30%. 1,204 prices changed back.', kind: 'undo' },
  ];
  // which markup the store's prices follow at a given minute (null: the old Audio plan)
  const markupAt = m => (m < 543 ? null : m < 690 ? 30 : m < 701 ? 25 : 30);
  const priceAt = (row, m) => { const k = markupAt(m); return k == null ? row.before : row.at(k); };
  return { ROWS, EVENTS, markupAt, priceAt, money };
})();

/* ===== controls ===== */
(function (root) {
(() => {
  const { seg, ease, clamp, lerp, put, money } = HC;
  const { ROWS } = RUN;
  const $ = s => root.querySelector(s);
  const cols = [...root.querySelectorAll('.col')];
  $('#controls-uRows').innerHTML = ROWS.slice(0, 3).map((r, k) => '<div><span>' + r.name + '</span><s class="num">' + money(r.before) + '</s><b class="num" data-u="' + k + '">' + money(r.at(30)) + '</b></div>').join('');
  const uVals = [...root.querySelectorAll('[data-u]')];
  const setSent = HC.odo($('#controls-qSent')), setUpd = HC.odo($('#controls-rUpd'));

  // the story: forward from the visitor's approval, and back again on undo
  // phase time runs 0..8 forward; the undo runs 8..12
  let base = 0, touched = false, undoAt = null, approveAt = HC.q.get('approved') ? -20 : null;   // probe: ?approved=1
  $('#controls-bApprove').onclick = () => { touched = true; approveAt = curT; undoAt = null; };
  // undo keeps the run where it is and sends it back from there
  $('#controls-bUndo').onclick = () => { if (approveAt == null) approveAt = curT - curS + 1.2; touched = true; undoAt = curT; };
  let curT = 0, curS = 0;

  function layout() {
    const cr = $('#controls-chain').getBoundingClientRect(), c0 = cols[0].querySelector('.card').getBoundingClientRect();
    const y = c0.top - cr.top + 60, w = cr.width;
    $('#controls-thread').style.top = y + 'px';
    $('#controls-tsv').setAttribute('viewBox', `0 0 ${w} 40`);
    const d = `M${w * 0.06} 20 L${w * 0.94} 20`;
    $('#controls-tbase').setAttribute('d', d); $('#controls-tgo').setAttribute('d', d);
    const len = $('#controls-tgo').getTotalLength(); $('#controls-tgo').style.strokeDasharray = len; $('#controls-tgo').dataset.len = len;
  }

  const fades = root.querySelectorAll('[data-f]');
  function render(t) {
    curT = t;
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.05 + k * 0.1, 0.8 + k * 0.1)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 14).toFixed(1)}px)`); });
    put($('#controls-hint'), 'opacity', ease.out(seg(t, 1, 1.6)).toFixed(3));
    // story time: scripted loop of 16s until the visitor presses a button
    // nothing plays by itself: the visitor presses Approve Plan, then Undo
    const s = approveAt == null ? 0 : t - approveAt + 1.2, u = undoAt == null ? null : t - undoAt;
    // forward: approve 1.2, pulse to run 1.6 to 2.6, sending to 4.6, pulse to receipt 4.6 to 5.4, confirmed 6.2, pulse to history 6.4 to 7.2
    curS = s;
    const approved = s >= 1.2;
    put($('#controls-aPill'), 'text', approved ? 'Approved' : 'Draft'); $('#controls-aPill').className = 'pl ' + (approved ? 'ok' : 'cp');
    put($('#controls-aWho'), 'text', approved && !(u != null && u > 4.4) ? 'Approved by you' : 'Waiting for you');
    $('#controls-bApprove').disabled = approved && !(u != null && u > 4.4);
    const sendP = ease.inOut(seg(s, 2.6, 4.6));
    const back = u == null ? 0 : ease.inOut(seg(u, 0.2, 4.2));            // the pulse travelling back
    const restored = u == null ? 0 : ease.inOut(seg(u, 1.4, 3.4));
    setSent(1204 * sendP * (1 - restored)); put($('#controls-qBar'), '--p', (sendP * (1 - restored)).toFixed(3));
    put($('#controls-qPill'), 'text', u != null && u > 1.4 ? 'Restored' : sendP >= 1 ? 'Sent' : sendP > 0 ? 'Sending' : 'Waiting');
    $('#controls-qPill').className = 'pl ' + (sendP >= 1 && u == null ? 'ok' : sendP > 0 ? 'cp' : '');
    put($('#controls-qNote'), 'text', u != null && u > 1.4 ? '1,204 prices put back' : sendP >= 1 ? 'All 1,204 live together' : 'Starts the moment the plan is approved');
    setUpd(1204 * ease.out(seg(s, 5.2, 6.2)));
    const conf = s >= 6.2;
    put($('#controls-rRes'), 'text', u != null && u > 2.4 ? 'Undone' : conf ? 'Confirmed' : s > 5.2 ? 'Checking' : 'Waiting');
    put($('#controls-rNote'), 'text', u != null && u > 2.4 ? 'The undo is recorded too' : conf ? 'Every new price confirmed live in Shopify' : 'Every price is checked in your store afterward');
    put($('#controls-uPill'), 'text', u != null && u > 3.4 ? 'Undone' : s >= 7.2 ? 'Live' : 'Waiting'); $('#controls-uPill').className = 'pl' + (u != null && u > 3.4 ? ' cp' : '');
    put($('#controls-uRows'), 'opacity', s >= 7.2 || u != null ? 1 : 0.35);
    put($('#controls-uRows').previousElementSibling, 'text', s >= 7.2 || u != null ? '1,204 prices · Confirmed' : 'Appears here once the update is confirmed');
    uVals.forEach((el, k) => { const back = u != null && u > 0.4 + k * 0.2; put(el, 'text', money(back ? ROWS[k].before : ROWS[k].at(30))); put(el.previousElementSibling, 'text', money(back ? ROWS[k].at(30) : ROWS[k].before)); });
    put($('#controls-uNote'), 'text', u != null && u > 0.4 ? '1,204 prices changed back' : '');
    $('#controls-bUndo').disabled = s < 7.2 || u != null;
    // the thread: fills left to right as the run moves, and the pulse travels; on undo it runs back
    const fwd = clamp(seg(s, 1.4, 2.4) / 3 + seg(s, 4.6, 5.4) / 3 + seg(s, 6.4, 7.2) / 3);
    const pos = u == null ? fwd : fwd * (1 - back);
    const len = +$('#controls-tgo').dataset.len || 1000;
    $('#controls-tgo').style.strokeDashoffset = (len * (1 - pos)).toFixed(1);
    const tw = $('#controls-thread').getBoundingClientRect().width;
    put($('#controls-pulse'), 'left', (tw * (0.06 + 0.88 * pos)).toFixed(1) + 'px');
    const moving = (s > 1.4 && s < 7.3 && u == null) || (u != null && u < 4.3);
    put($('#controls-pulse'), 'opacity', moving ? 1 : 0);
    // the card the story is at is lit
    const at = u != null && u < 4.3 ? Math.round(3 * (1 - back)) : s < 1.4 ? 0 : s < 4.6 ? 1 : s < 6.4 ? 2 : 3;
    cols.forEach((c, k) => c.classList.toggle('lit', k === at && (s > 0.9 || u != null)));
    const cr = $('#controls-chain').getBoundingClientRect();
    const aim = (el, btn, on) => {
      const r = btn.getBoundingClientRect();
      put(el, 'left', (r.left - cr.left + r.width / 2).toFixed(1) + 'px');
      put(el, 'top', (r.bottom - cr.top + 10 + Math.sin(t * 5) * 5).toFixed(1) + 'px');
      put(el, 'opacity', on ? ease.out(seg(t, 1.2, 1.8)).toFixed(3) : '0');
    };
    aim($('#controls-goA'), $('#controls-bApprove'), !$('#controls-bApprove').disabled);
    aim($('#controls-goU'), $('#controls-bUndo'), !$('#controls-bUndo').disabled);
  }
  HC.run({ root, render, layout, duration: 16, name: '5B · The Thread' });
})();
})(document.getElementById('controls'));

/* ===== docs/design/section-concepts/07-next/next-data.js ===== */
/* Section 7 data: Treehouse Toys (the same store as section 3). The three capabilities next on the
   roadmap, each arriving as something a person reviews. Feeds bring costs (which then flow through
   plans as any cost change does); suggestions and competitor analysis arrive as drafts that wait for
   approval. Product names are used for illustration; costs and prices are examples.
   Agrees with section 3: Monopoly is on the Games plan (cost plus 45%, $21.99), Nerf on the Outdoor
   plan (cost plus 40%, $16.99), LEGO on the Building sets plan (cost plus 20%), and the Squishmallows
   are in no plan at $12.99 and $19.99. */
window.NEXT = [
  { id: 'feed', src: 'Vendor feed', title: 'Hasbro cost feed updated 64 costs', when: 'Overnight',
    body: 'New costs for 64 Hasbro products arrived overnight. Up 2.1% on average.',
    note: 'These are just new costs. Prices on your markup plans follow them automatically.',
    follow: '79 prices on the Games and Outdoor plans update automatically.',
    kind: 'info', stat: [['Products', '64'], ['Average change', '+2.1%'], ['Prices updating', '79']],
    rows: [['Monopoly Classic Board Game', '$15.10', '$15.40'], ['Nerf Elite 2.0 Commander', '$12.10', '$12.35'], ['Play-Doh Modeling Compound 10 Pack', '$6.40', '$6.55']],
    cols: ['Product', 'Cost was', 'Cost now'] },
  { id: 'suggest', src: 'Rule suggestion', title: 'Put 86 Squishmallows on a plan', when: '9:20 AM',
    body: '86 Squishmallows have no plan and still sit at their original price. Suggested: a Shared plan at cost plus 50%, ending in .99.',
    note: 'Why: your other plush sits at cost plus 45% to 55%. These prices have not moved since March. Their costs rose 5%.',
    sent: '86 new prices are live',
    kind: 'draft', stat: [['Products', '86'], ['Prices', '86'], ['Up · down', '65 · 21']],
    rows: [['Squishmallows Cam the Cat 8 in', '$12.99', '$13.99'], ['Squishmallows Wendy the Frog 12 in', '$19.99', '$22.99'], ['Squishmallows Maui the Pineapple 5 in', '$7.99', '$6.99']],
    cols: ['Product', 'Now', 'With the plan'] },
  { id: 'rival', src: 'Competitor analysis', title: 'LEGO AT-AT priced above 9 listings', when: '10:05 AM',
    body: 'Your $849.99 is 6% above the typical $799.99 across 9 similar listings this week.',
    note: 'Suggested: a Custom plan at cost plus 14% for a price of $807.99. Nothing changes unless you approve it.',
    sent: 'The new price is live',
    kind: 'draft', band: { lo: 764.99, mid: 799.99, hi: 849.99, you: 849.99, next: 807.99, axis: [740, 880],
      listings: [764.99, 774.99, 784.99, 794.99, 799.99, 809.99, 819.99, 829.99, 849.99] },
    // cost $708.30: the Building sets plan's cost plus 20% gives today's $849.99; cost plus 14% gives $807.99
    cost: 708.30, markNow: 20, markNext: 14,
    stat: [['Listings compared', '9'], ['Middle price', '$799.99'], ['Yours', '$849.99']],
    rows: [['LEGO Star Wars AT-AT 75313', '$849.99', '$807.99']],
    cols: ['Product', 'Now', 'With the plan'] },
];

/* ===== smart ===== */
(function (root) {
(() => {
  const { seg, ease, clamp, put, money, q } = HC;
  const $ = s => root.querySelector(s);
  const N = window.NEXT, byId = Object.fromEntries(N.map(x => [x.id, x]));
  // arrival order: the feed came overnight, then the suggestion, then the competitor check
  const ARRIVE = { feed: 1.0, suggest: 1.45, rival: 1.9 };
  const CYCLE = ['rival', 'suggest', 'feed'], HOLD = 5.5;
  const num = s => parseFloat(String(s).replace(/[$,]/g, ''));

  // list rows
  $('#smart-items').innerHTML = N.map(x => '<button type="button" class="it" role="option" data-id="' + x.id + '"><span class="fl"></span><div class="top"><span>' + x.src + '</span><time>' + x.when + '</time></div><b>' + x.title + '</b><span class="pl" data-pill></span></button>').join('');
  const rowEl = Object.fromEntries([...root.querySelectorAll('.it')].map(el => [el.dataset.id, el]));

  // state: what the visitor did to each draft. { did: 'approve' | 'dismiss', at, undoAt }
  const acts = {};
  let touched = false, sel = null, selAt = 0, curT = 0, hover = false, cyc = 0, lastT = 0;
  const choose = id => { if (id !== sel) { sel = id; selAt = curT; } };
  Object.entries(rowEl).forEach(([id, el]) => el.onclick = () => { if (curT < ARRIVE[id]) return; touched = true; choose(id); });
  $('#smart-app').addEventListener('pointerenter', () => hover = true);
  $('#smart-app').addEventListener('pointerleave', () => hover = false);

  function status(id, t) {
    const x = byId[id], a = acts[id];
    if (x.kind === 'info') return 'info';
    if (!a || (a.undoAt != null && t >= a.undoAt)) return 'draft';
    return a.did === 'approve' ? 'approved' : 'dismissed';
  }
  const PILL = { info: ['Info', 'pl'], draft: ['Draft', 'pl cp'], approved: ['Approved', 'pl ok'], dismissed: ['Dismissed', 'pl'] };

  // the open item
  let paneKey = null, rolls = [], nowRolls = [];
  function buildPane(id) {
    const x = byId[id];
    const two = (a, b) => '<span><span>' + a + '</span><span>' + b + '</span></span>';
    let h = '<div class="pane-in" id="smart-pin"><div class="ph"><span>' + x.src + '</span><time>' + x.when + '</time></div><h4>' + x.title + '</h4><p class="body">' + x.body + '</p>';
    h += '<div class="stats">' + x.stat.map(s => '<div><div class="l">' + s[0] + '</div><b class="num">' + s[1] + '</b></div>').join('') + '</div>';
    if (x.band) {
      const b = x.band, [lo, hi] = b.axis, X = v => ((v - lo) / (hi - lo) * 100).toFixed(2) + '%';
      h += '<div class="band"><div class="ax"></div><div class="rg" style="left:' + X(b.lo) + ';width:calc(' + X(b.hi) + ' - ' + X(b.lo) + ')"></div>' + b.listings.map((v, k) => '<span class="d" data-d="' + k + '" style="left:' + X(v) + '"></span>').join('') +
        '<span class="mk mid" style="left:' + X(b.mid) + '"><i></i>Middle ' + money(b.mid) + '</span><span class="mk you" style="left:' + X(b.you) + '">Yours ' + money(b.you) + '<i></i></span><span class="mk nx" id="smart-bnx" style="left:' + X(b.you) + '">With the plan ' + money(b.next) + '<i></i></span></div>';
    }
    h += '<div class="tr th">' + x.cols.map(c => '<span>' + c + '</span>').join('') + '</div>';
    h += x.rows.map((r, k) => { const d = num(r[2]) > num(r[1]) ? 'up' : 'dn'; return '<div class="tr"><span class="pn">' + r[0] + '</span><span class="roll now" data-n="' + k + '">' + two(r[1], r[2]) + '</span><span class="roll nx ' + d + '" data-r="' + k + '">' + two(r[1], r[2]) + '</span></div>'; }).join('');
    h += '<p class="why">' + x.note + '</p><div class="foot" id="smart-foot"></div></div>';
    $('#smart-pane').innerHTML = h;
    rolls = [...root.querySelectorAll('[data-r]')]; nowRolls = [...root.querySelectorAll('[data-n]')];
    const f = $('#smart-foot');
    f.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      touched = true;
      const a = acts[sel];
      if (b.dataset.a === 'undo') { if (a) a.undoAt = curT; }
      else acts[sel] = { did: b.dataset.a, at: curT, undoAt: null };
    };
  }
  function footHTML(id, st, t) {
    const x = byId[id];
    if (st === 'info') return '<span class="ok"><i></i>No approval needed</span><span>' + x.follow + '</span>';
    if (st === 'draft') return '<button type="button" class="b pr" data-a="approve">Approve plan</button><button type="button" class="b" data-a="dismiss">Dismiss</button><span class="gap"></span><span>Nothing changes in your store until you approve.</span>';
    const n = x.sent;
    if (st === 'approved') return '<span class="ok"><i></i>Approved by Maya Ruiz</span><span>' + n + '</span><span class="gap"></span><button type="button" class="b" data-a="undo">Undo</button>';
    return '<span>Dismissed. Nothing changed.</span><span class="gap"></span><button type="button" class="b" data-a="undo">Restore</button>';
  }

  // probes for headless checks: ?sel=rival&act=approve
  if (q.has('sel')) { touched = true; sel = q.get('sel'); selAt = -10; if (q.get('act')) acts[sel] = { did: q.get('act'), at: -10, undoAt: null }; }

  const fades = root.querySelectorAll('[data-f]');
  function render(t) {
    const dt = Math.max(0, Math.min(0.1, t - lastT)); lastT = t; curT = t;
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.05 + k * 0.12, 0.8 + k * 0.12)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 14).toFixed(1)}px)`); });
    put($('#smart-hint'), 'opacity', ease.out(seg(t, 1.2, 1.8)).toFixed(3));

    // arrivals: newest on top, each pushes the earlier ones down
    const arrived = N.filter(x => t >= ARRIVE[x.id]).map(x => x.id);
    N.forEach(x => {
      const el = rowEl[x.id], a = ARRIVE[x.id];
      const p = ease.out(seg(t, a, a + 0.45));
      const above = N.filter(y => ARRIVE[y.id] > a).reduce((s, y) => s + ease.inOut(seg(t, ARRIVE[y.id], ARRIVE[y.id] + 0.45)), 0);
      put(el, 'transform', `translateY(${(above * 112 - (1 - p) * 16).toFixed(1)}px)`);
      put(el, 'opacity', p.toFixed(3));
      put(el, 'visibility', p > 0 ? 'visible' : 'hidden');
      put(el, '--new', (0.9 * (1 - seg(t, a + 0.3, a + 2.2))).toFixed(3));
      const st = status(x.id, t); const [lab, cls] = PILL[st];
      const pill = el.querySelector('[data-pill]'); put(pill, 'text', lab); put(pill, 'class', cls);
    });
    const waiting = N.filter(x => status(x.id, t) === 'draft' && t >= ARRIVE[x.id]).length;
    put($('#smart-count'), 'text', String(waiting)); put($('#smart-count'), 'class', 'ct' + (waiting ? '' : ' z'));
    put($('#smart-lsub'), 'text', arrived.length ? arrived.length + ' new · ' + (waiting ? waiting + ' waiting for your approval' : 'nothing waiting for you') : 'Nothing new yet');

    // which item is open: follows arrivals, then cycles until the visitor opens one; pointing at the app holds it
    if (!touched) {
      if (t < ARRIVE.rival + 0.2) { const last = arrived[arrived.length - 1]; if (last) choose(last); cyc = 0; }
      else { if (!hover) cyc += dt; choose(CYCLE[Math.floor(cyc / HOLD) % CYCLE.length]); }
    }
    if (!sel) { put($('#smart-pane'), 'html', '<div class="pane-in"><p class="body" style="margin-top:40px">New items appear here as they arrive.</p></div>'); return; }
    const st = status(sel, t), key = sel;
    if (paneKey !== key) { buildPane(sel); paneKey = key; }
    put($('#smart-foot'), 'html', footHTML(sel, st, t));
    Object.entries(rowEl).forEach(([id, el]) => { el.classList.toggle('sel', id === sel); el.setAttribute('aria-selected', id === sel); put(el, '--sel', id === sel ? '1' : '0'); });
    const since = t - selAt;
    put($('#smart-pin'), '--in', ease.out(seg(since, 0, 0.35)).toFixed(3));
    // the preview column rolls to the proposed values, one row after another
    rolls.forEach((el, k) => put(el, '--p', ease.inOut(seg(since, 0.45 + k * 0.18, 1.05 + k * 0.18)).toFixed(3)));
    // the store column only moves once a plan is approved, and moves back on undo
    const a = acts[sel];
    let live = 0;
    if (a && a.did === 'approve') live = a.undoAt == null ? ease.inOut(seg(t - a.at, 0.2, 0.9)) : 1 - ease.inOut(seg(t - a.undoAt, 0.1, 0.8));
    nowRolls.forEach(el => put(el, '--p', byId[sel].kind === 'info' ? '0' : live.toFixed(3)));
    // competitor band: the listings land, then the plan's price slides in from yours
    if (byId[sel].band) {
      const b = byId[sel].band, X = v => ((v - b.axis[0]) / (b.axis[1] - b.axis[0]) * 100);
      root.querySelectorAll('[data-d]').forEach(d => { const k = +d.dataset.d, p = ease.back(seg(since, 0.3 + k * 0.07, 0.65 + k * 0.07)); put(d, 'transform', `scale(${p.toFixed(3)})`); });
      const p = ease.inOut(seg(since, 1.2, 2.0));
      put($('#smart-bnx'), 'left', (X(b.you) + (X(b.next) - X(b.you)) * p).toFixed(2) + '%');
      put($('#smart-bnx'), 'opacity', seg(since, 1.1, 1.4).toFixed(3));
    }
  }
  HC.run({ root, render, duration: 20, name: '7A · The Inbox' });
})();
})(document.getElementById('smart'));

/* ===== docs/design/section-concepts/09-join/join.js ===== */
/* Section 9: the waitlist form and the footer. Social links are placeholders until the handles exist.
   Design previews only show the result. The real page posts to Web3Forms once KEY is set, and until then says plainly that nothing was sent. */
window.JOIN = (() => {
  const KEY = '';   // Web3Forms access key: set before launch
  const PREVIEW = /\/docs\/design\//.test(location.pathname);
  const clean = v => v.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const okStore = v => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(clean(v));
  function bind(form, { onInput, onDone } = {}) {
    const f = { email: form.email, store: form.store, size: form.catalog_size };
    const status = form.querySelector('[data-status]');
    const read = () => ({ email: f.email.value.trim(), store: clean(f.store.value), size: f.size.value });
    form.addEventListener('input', () => onInput && onInput(read()));
    form.addEventListener('change', () => onInput && onInput(read()));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = read();
      const bad = [[f.email, !okEmail(f.email.value), 'Enter an email so we can reach you.'], [f.store, !okStore(f.store.value), 'Enter your store address, like yourstore.com.'], [f.size, !v.size, 'Pick your catalog size.']];
      bad.forEach(([el, b]) => el.setAttribute('aria-invalid', String(b)));
      const first = bad.find(x => x[1]);
      if (first) { status.textContent = first[2]; first[0].focus(); return; }
      if (form.botcheck && form.botcheck.checked) return;
      status.textContent = '';
      // design previews only show the result; the real page sends it
      if (PREVIEW) { onDone && onDone(v); return; }
      if (!KEY) { status.textContent = 'Signups open soon. Nothing was sent yet.'; return; }
      const btn = form.querySelector('button[type="submit"]'); btn.disabled = true; status.textContent = 'Sending…';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: KEY, subject: 'New StorePricer waitlist signup', email: v.email, store: v.store, catalog_size: v.size, botcheck: false }),
      }).then(r => r.json().then(d => { if (!r.ok || !d.success) throw new Error(d.message || 'failed'); }))
        .then(() => { status.textContent = ''; onDone && onDone(v); })
        .catch(() => { status.textContent = 'That did not go through. Please try again in a moment.'; })
        .finally(() => { btn.disabled = false; });
    });
    return { read, fill(v) { f.email.value = v.email || ''; f.store.value = v.store || ''; f.size.value = v.size || ''; onInput && onInput(read()); } };
  }
  const SIZES = ['Under 1,000', '1,000 to 5,000', '5,000 to 25,000', '25,000 to 100,000', 'Over 100,000'];
  const sizeOptions = () => '<option value="">Choose one</option>' + SIZES.map(s => '<option>' + s + '</option>').join('');
  const FOOTER = `<footer class="foot">
  <div class="wrap">
    <div class="foot-top">
      <div><a class="brand" href="#top"><svg aria-hidden="true"><use href="#mark"/></svg><b>StorePricer</b></a>
        <p>Pricing rules for your online store. Preview, approve, and undo changes. Leverage your bottom line.</p>
        <p class="for"><span>Built for</span><img src="assets/brand/shopify-logo.png" alt="Shopify" width="117" height="30"></p></div>
      <div><h3>The product</h3><ul><li><a href="#ranking">Ranked Pricing</a></li><li><a href="#how">How it works</a></li><li><a href="#controls">Price Controls</a></li><li><a href="#smart">Smart Selling</a></li></ul></div>
      <div><h3>StorePricer</h3><ul><li><a href="#waitlist">Join the waitlist</a></li><li><a href="https://whatsoever.ai">Whatsoever.ai</a></li></ul></div>
    </div>
    <div class="foot-bot"><span>© 2026 StorePricer · A <a href="https://whatsoever.ai">Whatsoever.ai</a> brand</span>
      <nav class="social" aria-label="StorePricer on social media">
        <a href="#" aria-label="StorePricer on X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        <a href="#" aria-label="StorePricer on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></a>
        <a href="#" aria-label="StorePricer on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
      </nav></div>
  </div>
</footer>`;
  return { bind, SIZES, sizeOptions, FOOTER };
})();

/* ===== waitlist ===== */
(function (root) {
(() => {
  const { seg, ease, put, money, catalog, q } = HC;
  const $ = s => root.querySelector(s);
  $('#waitlist-size').innerHTML = JOIN.sizeOptions();

  // rows from an electronics store, an apparel store and a toy store, interleaved
  const APPAREL = [["Levi's 501 Original Fit Jeans", '34W 32L', 'LEV-501-34W', 'Denim plan', 79.99], ['Patagonia Better Sweater Fleece Jacket', 'M', 'PAT-BSW-M', 'Outerwear plan', 149.99], ['Carhartt K87 Pocket T-Shirt', 'L', 'CHT-K87-L', 'Workwear plan', 21.99], ['New Balance 574 Core Sneakers', '10', 'NB-574-10', 'Footwear plan', 89.99], ['Columbia Steens Mountain Fleece', 'XL', 'COL-STNS-XL', 'Outerwear plan', 59.99], ['Patagonia Nano Puff Jacket', 'L', 'PAT-NANO-L', 'Outerwear plan', 239.99], ['Carhartt Duck Active Jacket', 'M', 'CHT-J130-M', 'Workwear plan', 149.99], ['New Balance 990v6 Sneakers', '9', 'NB-990-9', 'Footwear plan', 199.99]];
  const TOYS = [['LEGO Icons Orchid 10311', '', 'LEGO-10311', 'Building sets plan', 52.99], ['Jellycat Bashful Bunny', 'Beige', 'JC-BBUN-BGE', 'Plush plan', 23.99], ['Monopoly Classic Board Game', '', 'HAS-MONO', 'Games plan', 21.99], ['Hot Wheels 20 Car Gift Pack', '', 'MAT-HW20', 'Vehicles plan', 25.99], ['Barbie Dreamhouse', '', 'MAT-DREAM', 'Dolls plan', 189.99], ['Paw Patrol Lookout Tower', '', 'SPM-PAWT', 'Figures plan', 64.99], ['Crayola Inspiration Art Case', '', 'CRA-ART', 'Arts and crafts plan', 26.99], ['Nerf Elite 2.0 Commander', '', 'HAS-NERF', 'Outdoor plan', 16.99]];
  const ELEC = catalog(8, 3, 0.25).map(r => [r.name, r.variant, r.sku, r.plan, r.price]);
  const ROWS = []; for (let k = 0; k < 8; k++) ROWS.push(ELEC[k], APPAREL[k], TOYS[k]);
  const RH = 64, N = ROWS.length, LOOPH = RH * N;
  const els = ROWS.map(([n, v, sku, plan, pr]) => {
    const el = document.createElement('div'); el.className = 'r';
    el.innerHTML = '<span class="sku">' + sku + '</span><span class="pn">' + n + (v ? ' · ' + v : '') + '</span><span>' + plan + '</span><span class="pr num">' + money(pr) + '</span><span class="st">No change</span>';
    $('#waitlist-plane').appendChild(el); return el;
  });
  const sts = els.map(el => el.querySelector('.st'));

  const form = JOIN.bind($('#waitlist-form'), { onDone: v => { $('#waitlist-okLine').textContent = 'We will email ' + v.email + ' when early access opens.'; $('#waitlist-card').classList.add('sent'); } });
  if (q.get('sent')) { form.fill({ email: 'maya@treehousetoys.com', store: 'treehousetoys.com', size: '5,000 to 25,000' }); $('#waitlist-form').requestSubmit(); }

  const fades = root.querySelectorAll('[data-f]');
  function render(t) {
    fades.forEach((el, k) => { const p = ease.out(seg(t, 0.05 + k * 0.1, 0.8 + k * 0.1)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 14).toFixed(1)}px)`); });
    // the floor drifts toward the viewer; every 7s a check passes over it
    const off = (t * 18) % LOOPH;
    const cyc = (t - 1) % 7, on = t > 1 && cyc < 2.6, by = ease.inOut(Math.min(1, cyc / 2.6)) * 1500;
    put($('#waitlist-beam'), 'opacity', on ? (Math.min(1, cyc / 0.3) * (1 - Math.max(0, (cyc - 2.3) / 0.3))).toFixed(3) : '0');
    put($('#waitlist-beam'), 'transform', `translateY(${by.toFixed(1)}px)`);
    els.forEach((el, k) => {
      const y = ((k * RH - off) % LOOPH + LOOPH) % LOOPH;
      put(el, 'transform', `translateY(${y.toFixed(1)}px)`);
      const lit = on && y + RH / 2 < by && by - (y + RH / 2) < 380;
      el.classList.toggle('lit', lit);
      put(sts[k], 'text', lit ? 'Checked' : 'No change');
    });
  }
  HC.run({ root, render, duration: 16, name: '9B · The Board Returns' });
})();
})(document.getElementById('waitlist'));

/* ===== faq ===== */
(function (root) {
(() => {
  const { seg, ease, put } = HC;
  // one answer open at a time
  const all = [...root.querySelectorAll('details')];
  // two columns: first half left, second half right
  const second = document.createElement('div'); second.className = 'list';
  all.slice(Math.ceil(all.length / 2)).forEach(d => second.appendChild(d));
  root.querySelector('#faq-cols').appendChild(second);
  all.forEach(d => d.addEventListener('toggle', () => { if (d.open) all.forEach(o => { if (o !== d) o.open = false; }); }));
  const fades = root.querySelectorAll('[data-f]');
  function render(t) { fades.forEach((el, k) => { const p = ease.out(seg(t, 0.05 + k * 0.12, 0.7 + k * 0.12)); put(el, 'opacity', p.toFixed(3)); put(el, 'transform', `translateY(${((1 - p) * 12).toFixed(1)}px)`); }); }
  HC.run({ root, render, duration: 2, name: '10 · Questions' });
})();
})(document.getElementById('faq'));

/* ===== the page ===== */
(function () {
  const stick = document.getElementById('stick'), totop = document.getElementById('totop');
  totop.onclick = () => { scrollTo({ top: 0, behavior: 'smooth' }); history.replaceState(null, '', location.pathname); };
  const on = () => { stick.classList.toggle('solid', scrollY > 8); totop.classList.toggle('on', scrollY > innerHeight * 0.8); };
  addEventListener('scroll', on, { passive: true }); on();
})();
