/* Practice Exam setup console.
   Domain weights are not stored here. js/exam.js passes EXAM_WEIGHTS
   through ExamSetup.setWeights(). scaleDraw is the one draw-count function
   the exam builder uses too. */
(() => {
  'use strict';

  const EXAM_WEIGHTS = {};

  const DOMAIN_META = {
    'Medications': { label: 'Medications', color: '#00ff41' },
    'Patient Safety and Quality Assurance': { label: 'Patient Safety', color: '#8dffb8' },
    'Order Entry and Processing': { label: 'Order Entry', color: '#00b330' },
    'Federal Requirements': { label: 'Federal Requirements', color: '#e6fff0', dashed: true }
  };

  const LENGTH_OPTIONS = [
    { value: 30, tag: 'short', help: 'Quick drill. Same blueprint ratio at one-third length.' },
    { value: 60, tag: 'mid',   help: 'Two-thirds length. Builds pacing stamina.' },
    { value: 90, tag: 'full',  help: 'Full simulation at the official question count.' }
  ];
  const TIMER_OPTIONS = [
    { value: 0,   word: 'No timer',  help: 'Self-paced. Focus on accuracy over speed.' },
    { value: 60,  unit: 'min',       help: 'Pressure pace with a tight 60-minute cap.' },
    { value: 110, unit: 'min', tag: 'real', help: 'The real PTCE limit for answering questions.' }
  ];

  const state = { length: 90, timer: 110 };
  const root = document.getElementById('examSetup');
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Largest-remainder rounding so domain counts always sum to n.
  function scaleDraw(weights, n) {
    const keys = Object.keys(weights);
    const total = keys.reduce((s, k) => s + weights[k], 0);
    if (!keys.length || !total || !n) return {};
    const rows = keys.map(k => {
      const raw = weights[k] * n / total;
      return { k, count: Math.floor(raw), rem: Math.round((raw - Math.floor(raw)) * 1e6), w: weights[k] };
    });
    let left = n - rows.reduce((s, r) => s + r.count, 0);
    [...rows].sort((a, b) => b.rem - a.rem || b.w - a.w).forEach(r => { if (left > 0) { r.count++; left--; } });
    return Object.fromEntries(rows.map(r => [r.k, r.count]));
  }

  function formatShare(weight, total) {
    const pct = Math.round((weight / total) * 10000) / 100;
    return String(pct);
  }

  function tweenNumber(el, to, ms = 450) {
    const from = Number(el.dataset.v ?? el.textContent) || 0;
    el.dataset.v = to;
    if (reduceMotion || from === to) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = now => {
      if (Number(el.dataset.v) !== to) return;
      const p = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function pausableTimeout(fn, ms) {
    let remaining = ms, started = 0, id = 0, settled = false;
    const held = () => document.hidden || root.classList.contains('is-paused');
    const finish = () => {
      if (settled) return;
      settled = true;
      document.removeEventListener('visibilitychange', onVis);
      obs.disconnect();
      fn();
    };
    const run = () => {
      if (settled || held()) return;
      started = performance.now();
      id = setTimeout(finish, remaining);
    };
    const onVis = () => {
      if (settled) return;
      if (held()) {
        if (started) {
          clearTimeout(id);
          remaining -= performance.now() - started;
          started = 0;
        }
      } else run();
    };
    document.addEventListener('visibilitychange', onVis);
    const obs = new MutationObserver(onVis);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    run();
  }

  /* ---------- radio groups (roving tabindex, arrows/Home/End) ---------- */
  function buildRadioGroup(groupEl, options, current, onChange) {
    groupEl.innerHTML = '';
    const btns = options.map(o => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xs-opt';
      b.setAttribute('role', 'radio');
      b.dataset.value = o.value;
      const val = o.word
        ? `<span class="xs-val is-word">${o.word}</span>`
        : `<span class="xs-val">${o.value}<small>${o.unit || 'questions'}</small></span>`;
      b.innerHTML = `<span class="xs-dia" aria-hidden="true"></span>${val}` +
        (o.tag ? `<span class="xs-chip">${o.tag}</span>` : '<span></span>');
      b.setAttribute('aria-label', o.word || `${o.value} ${o.unit || 'questions'}${o.tag ? ', ' + o.tag : ''}`);
      groupEl.appendChild(b);
      return b;
    });
    const select = (i, focus) => {
      btns.forEach((b, j) => {
        b.setAttribute('aria-checked', String(i === j));
        b.tabIndex = i === j ? 0 : -1;
      });
      if (focus) btns[i].focus();
      onChange(options[i]);
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(i, false));
      b.addEventListener('keydown', e => {
        const last = btns.length - 1;
        const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: last }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select((next + btns.length) % btns.length, true);
      });
    });
    select(Math.max(0, options.findIndex(o => o.value === current)), false);
  }

  /* ---------- reactor: one tick per drawn question, inner arc per weight ---------- */
  const R_TICK = 128, R_ARC = 116;
  const C_TICK = 2 * Math.PI * R_TICK, C_ARC = 2 * Math.PI * R_ARC;
  const GAP_TICK = 8, GAP_ARC = 10;

  function svgCircle(parent, r, attrs) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', 160); c.setAttribute('cy', 160); c.setAttribute('r', r); c.setAttribute('fill', 'none');
    for (const k in attrs) c.setAttribute(k, attrs[k]);
    parent.appendChild(c);
    return c;
  }

  const ringEls = {};
  function buildReactor() {
    const ticks = $('tickRing'), arcs = $('weightRing');
    ticks.innerHTML = ''; arcs.innerHTML = '';
    for (const k in ringEls) delete ringEls[k];
    Object.keys(EXAM_WEIGHTS).forEach(k => {
      const m = DOMAIN_META[k] || { color: '#00ff41' };
      ringEls[k] = {
        tick: svgCircle(ticks, R_TICK, { class: 'dom', stroke: m.color, 'stroke-width': 12, color: m.color }),
        arc: svgCircle(arcs, R_ARC, { class: 'dom xs-arc', stroke: m.color, 'stroke-width': 2.5, 'stroke-opacity': .75,
          'stroke-dasharray': `0 ${C_ARC}`, color: m.color, ...(m.dashed ? { 'stroke-linecap': 'butt' } : {}) })
      };
    });
  }

  function drawWeightArcs() {
    const keys = Object.keys(EXAM_WEIGHTS);
    const total = keys.reduce((s, k) => s + EXAM_WEIGHTS[k], 0);
    if (!keys.length || !total) return;
    const usable = C_ARC - keys.length * GAP_ARC;
    let start = GAP_ARC / 2;
    keys.forEach(k => {
      const len = usable * EXAM_WEIGHTS[k] / total;
      const el = ringEls[k].arc;
      el.setAttribute('stroke-dasharray', DOMAIN_META[k]?.dashed
        ? dashList(len, 5, 3) : `${len} ${C_ARC}`);
      el.setAttribute('stroke-dashoffset', -start);
      start += len + GAP_ARC;
    });
  }

  function dashList(len, dash, gap) {
    const out = [];
    for (let d = 0; d < len; d += dash + gap) out.push(Math.min(dash, len - d), gap);
    out[out.length - 1] = C_ARC;
    return out.join(' ');
  }

  function drawTicks(draw, n) {
    const keys = Object.keys(EXAM_WEIGHTS);
    if (!keys.length || !n) return;
    const slot = (C_TICK - keys.length * GAP_TICK) / n;
    const dash = slot - Math.min(2.4, slot * .3);
    let start = GAP_TICK / 2;
    keys.forEach(k => {
      const count = draw[k], el = ringEls[k].tick, arr = [];
      for (let i = 0; i < count; i++) arr.push(dash.toFixed(2), i < count - 1 ? (slot - dash).toFixed(2) : C_TICK * 2);
      el.setAttribute('stroke-dasharray', count ? arr.join(' ') : `0 ${C_TICK * 2}`);
      el.setAttribute('stroke-dashoffset', -start);
      start += count * slot + GAP_TICK;
    });
    const g = $('tickRing');
    g.classList.remove('redraw');
    try { void g.getBBox(); } catch (e) { /* empty ring before layout */ }
    g.classList.add('redraw');
  }

  /* ---------- domain list ---------- */
  const domEls = {};
  function buildDomainList() {
    const list = $('domList'); list.innerHTML = '';
    for (const k in domEls) delete domEls[k];
    const keys = Object.keys(EXAM_WEIGHTS);
    const total = keys.reduce((s, k) => s + EXAM_WEIGHTS[k], 0);
    keys.forEach(k => {
      const m = DOMAIN_META[k] || { label: k, color: '#00ff41' };
      const li = document.createElement('li');
      li.className = 'xs-dom' + (m.dashed ? ' is-dashed' : '');
      li.style.setProperty('--c', m.color);
      const share = total ? formatShare(EXAM_WEIGHTS[k], total) : '0';
      li.innerHTML = `<span class="xs-dname">${m.label}</span>` +
        `<span class="xs-dcount" data-v="0">0</span>` +
        `<span class="xs-dshare">${share}%<span class="sr-only"> of the exam</span></span>` +
        `<span class="xs-dbar" aria-hidden="true"><i style="width:0"></i></span>`;
      li.addEventListener('mouseenter', () => focusDomain(k));
      li.addEventListener('mouseleave', () => focusDomain(null));
      list.appendChild(li);
      domEls[k] = { li, count: li.querySelector('.xs-dcount'), bar: li.querySelector('.xs-dbar i'), share: total ? EXAM_WEIGHTS[k] / total : 0 };
    });
  }

  function focusDomain(key) {
    $('reactor').classList.toggle('has-focus', !!key);
    for (const k in ringEls) {
      ringEls[k].tick.classList.toggle('is-focus', k === key);
      ringEls[k].arc.classList.toggle('is-focus', k === key);
      if (domEls[k]) domEls[k].li.classList.toggle('is-focus', k === key);
    }
  }

  /* ---------- render ---------- */
  const fmtClock = sec => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;

  function render(changed) {
    const draw = scaleDraw(EXAM_WEIGHTS, state.length);
    const weights = Object.values(EXAM_WEIGHTS);
    const maxW = weights.length ? Math.max(...weights) : 1;
    tweenNumber($('qCount'), state.length);
    for (const k in draw) {
      if (!domEls[k]) continue;
      tweenNumber(domEls[k].count, draw[k]);
      domEls[k].li.setAttribute('aria-label', `${DOMAIN_META[k]?.label || k}: ${draw[k]} questions`);
      domEls[k].bar.style.width = (EXAM_WEIGHTS[k] / maxW * 100).toFixed(1) + '%';
    }
    if (changed !== 'timer') drawTicks(draw, state.length);

    const t = $('timeVal');
    t.classList.toggle('is-off', !state.timer);
    t.textContent = state.timer ? `${state.timer}:00` : 'UNTIMED';
    $('paceVal').textContent = state.timer
      ? `${fmtClock(state.timer * 60 / state.length)} per question` : 'self-paced';
    if (changed === 'timer' && !reduceMotion) { t.classList.remove('xs-flick'); void t.offsetWidth; t.classList.add('xs-flick'); }
    $('xsStatus').textContent = '';
  }

  function getConfig() {
    return { length: state.length, timerMinutes: state.timer, draw: scaleDraw(EXAM_WEIGHTS, state.length) };
  }

  /* ---------- actions ---------- */
  function onStart() {
    const btn = $('startBtn');
    if (btn.classList.contains('is-loading')) return;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    $('startLbl').textContent = 'LOADING';
    $('startSub').textContent = 'Construct initializing…';
    pausableTimeout(() => {
      const cfg = getConfig();
      root.dispatchEvent(new CustomEvent('examsetup:start', { detail: cfg, bubbles: true }));
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      $('startLbl').textContent = 'START EXAM';
      $('startSub').textContent = 'Enter the simulation';
      $('xsStatus').textContent = `Construct loaded: ${cfg.length} questions, ${cfg.timerMinutes ? cfg.timerMinutes + ' min' : 'untimed'}.`;
    }, reduceMotion ? 250 : 1300);
  }

  function onBack() {
    root.dispatchEvent(new CustomEvent('examsetup:back', { bubbles: true }));
    $('xsStatus').textContent = 'Returning home.';
  }

  /* ---------- code rain (static DOM, CSS-animated) ---------- */
  function buildRain() {
    const host = root.querySelector('.xs-rain');
    if (host.childElementCount) return;
    const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012345789Z';
    const cols = 18;
    for (let i = 0; i < cols; i++) {
      let s = '';
      for (let j = 0; j < 22; j++) s += glyphs[(Math.random() * glyphs.length) | 0];
      const span = document.createElement('span');
      span.textContent = s + s;
      span.style.left = `${(i + Math.random() * .6) / cols * 100}%`;
      span.style.animationDuration = `${16 + Math.random() * 14}s`;
      span.style.animationDelay = `${-Math.random() * 20}s`;
      host.appendChild(span);
    }
  }

  function syncPaused() {
    const hostHidden = !!(root.closest('.hidden'));
    root.classList.toggle('is-paused', document.hidden || hostHidden);
  }

  /* ---------- init ---------- */
  function init() {
    if (!root) return;
    buildRain();
    buildReactor();
    buildDomainList();
    buildRadioGroup($('lenGroup'), LENGTH_OPTIONS, state.length, o => {
      $('lenHelp').textContent = o.help;
      if (state.length !== o.value) { state.length = o.value; render('length'); }
    });
    buildRadioGroup($('timGroup'), TIMER_OPTIONS, state.timer, o => {
      $('timHelp').textContent = o.help;
      if (state.timer !== o.value) { state.timer = o.value; render('timer'); }
    });
    render('init');
    requestAnimationFrame(() => requestAnimationFrame(drawWeightArcs));
    $('startBtn').addEventListener('click', onStart);
    $('backBtn').addEventListener('click', onBack);
    document.addEventListener('visibilitychange', syncPaused);
    const intro = document.getElementById('introScreen');
    if (intro && typeof MutationObserver === 'function') {
      new MutationObserver(syncPaused).observe(intro, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    syncPaused();
  }

  function setWeights(w) {
    for (const k in EXAM_WEIGHTS) delete EXAM_WEIGHTS[k];
    Object.assign(EXAM_WEIGHTS, w);
    if (!root) return;
    buildReactor();
    buildDomainList();
    render('init');
    drawWeightArcs();
  }

  window.ExamSetup = {
    getConfig,
    scaleDraw,
    setWeights
  };

  init();
})();
