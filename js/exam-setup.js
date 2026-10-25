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
    pausableTimeout(() => {
      const cfg = getConfig();
      root.dispatchEvent(new CustomEvent('examsetup:start', { detail: cfg, bubbles: true }));
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      $('startLbl').textContent = 'Enter the Construct';
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


  /* ---------- Quiz Mode holo panel ---------- */
  const QUIZ_MODES = [
    { value: 'quick10', name: 'Quick 10', desc: 'Ten random questions',
      icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>' },
    { value: 'chapter', name: 'Chapter Test', desc: 'One chapter, your pick',
      icon: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4Z"/><path d="M8 9h8M8 13h6"/>' },
    { value: 'missed', name: 'Missed', desc: 'Redo what you got wrong',
      icon: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>' },
    { value: 'bookmarked', name: 'Bookmarked', desc: 'Your flagged questions',
      icon: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>' },
    { value: 'weak', name: 'Weakest', desc: 'Targets your weakest area',
      icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>' }
  ];
  const QUIZ_CHAPTERS = [
    { value: 'All', name: 'All' },
    { value: 'Medications', name: 'Medications' },
    { value: 'Patient Safety and Quality Assurance', name: 'Patient Safety' },
    { value: 'Order Entry and Processing', name: 'Order Entry' },
    { value: 'Federal Requirements', name: 'Federal' }
  ];
  const quiz = { mode: 'quick10', chapter: 'All', open: false };

  function setSwitch(btn, on) {
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    const th = btn.querySelector('.xq-sw-thumb');
    if (th) th.style.removeProperty('--x');
    if (th) th.style.transform = '';
  }

  // Drag the lever or click/press it. Past halfway on release it latches.
  function makeSwitch(btn, onChange) {
    const track = btn.querySelector('.xq-sw-track');
    const thumb = btn.querySelector('.xq-sw-thumb');
    const travel = () => track.clientWidth - thumb.offsetWidth - 4;
    let down = null, moved = false, swallow = false;
    track.addEventListener('pointerdown', e => {
      down = { x: e.clientX, on: btn.classList.contains('is-on') };
      moved = false;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 4) { moved = true; btn.classList.add('is-drag'); }
      if (!moved) return;
      const x = Math.max(0, Math.min(travel(), (down.on ? travel() : 0) + dx));
      thumb.style.transform = `translateX(${x}px)`;
      thumb.dataset.x = x;
    });
    const end = () => {
      if (!down) return;
      const wasMoved = moved;
      const x = parseFloat(thumb.dataset.x || '0');
      btn.classList.remove('is-drag');
      thumb.style.transform = '';
      delete thumb.dataset.x;
      down = null;
      if (wasMoved) {
        swallow = true;
        setTimeout(() => { swallow = false; }, 0);
        onChange(x > travel() / 2);
      }
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    btn.addEventListener('click', () => {
      if (swallow) return;
      onChange(!btn.classList.contains('is-on'));
    });
  }

  function renderQuiz() {
    const m = QUIZ_MODES.find(x => x.value === quiz.mode);
    root.querySelectorAll('.xq-tile').forEach(t => {
      const on = t.dataset.value === quiz.mode;
      t.setAttribute('aria-checked', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    root.querySelectorAll('.xq-chip').forEach(c => {
      const on = c.dataset.value === quiz.chapter;
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.tabIndex = on ? 0 : -1;
    });
    const isChap = quiz.mode === 'chapter';
    $('xqChapter').classList.toggle('is-off', !isChap);
    root.querySelectorAll('.xq-chip').forEach(c => { c.disabled = !isChap; });
    const ch = QUIZ_CHAPTERS.find(x => x.value === quiz.chapter);
    $('xqStatus').innerHTML = `Mode <b>// ${m.name}</b>` + (isChap ? ` <b>// ${ch.name}</b>` : '') + ' // ready';
  }

  function radioKeys(group, selector, pick) {
    group.addEventListener('keydown', e => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      const items = [...group.querySelectorAll(selector)].filter(i => !i.disabled);
      const i = items.findIndex(x => x.getAttribute('aria-checked') === 'true');
      const n = items[(i + keys[e.key] + items.length) % items.length];
      e.preventDefault();
      pick(n.dataset.value);
      n.focus();
    });
  }

  function setQuizOpen(on) {
    if (quiz.open === on) return;
    quiz.open = on;
    const panel = $('xqPanel');
    const origin = $('xqOpen').querySelector('.xq-sw-thumb').getBoundingClientRect();
    const box = root.getBoundingClientRect();
    panel.style.setProperty('--ex', `${origin.left + origin.width / 2 - box.left}px`);
    panel.style.setProperty('--ey', `${origin.top + origin.height / 2 - box.top}px`);
    panel.classList.toggle('is-open', on);
    root.classList.toggle('is-quiz', on);
    setSwitch($('xqOpen'), on);
    setSwitch($('xqClose'), on);
    root.querySelector('.xs-slab').inert = on;
    root.querySelector('.xs-rail').inert = on;
    panel.inert = !on;
    if (on) {
      setTimeout(() => { if (quiz.open) (root.querySelector('.xq-tile[aria-checked="true"]') || $('xqStart')).focus(); }, reduceMotion ? 0 : 500);
    } else {
      $('xqOpen').focus({ preventScroll: true });
    }
  }

  function initQuiz() {
    if (!$('xqPanel')) return;
    const tiles = $('xqTiles');
    QUIZ_MODES.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xq-tile';
      b.dataset.value = m.value;
      b.setAttribute('role', 'radio');
      b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${m.icon}</svg><span class="xq-tname">${m.name}</span><span class="xq-tdesc">${m.desc}</span>`;
      b.addEventListener('click', () => { quiz.mode = m.value; renderQuiz(); });
      tiles.appendChild(b);
    });
    const chips = $('xqChips');
    QUIZ_CHAPTERS.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xq-chip';
      b.dataset.value = c.value;
      b.setAttribute('role', 'radio');
      b.textContent = c.name;
      b.addEventListener('click', () => { quiz.chapter = c.value; renderQuiz(); });
      chips.appendChild(b);
    });
    radioKeys(tiles, '.xq-tile', v => { quiz.mode = v; renderQuiz(); });
    radioKeys(chips, '.xq-chip', v => { quiz.chapter = v; renderQuiz(); });
    makeSwitch($('xqOpen'), setQuizOpen);
    makeSwitch($('xqClose'), setQuizOpen);
    $('xqBack').addEventListener('click', () => setQuizOpen(false));
    $('xqStart').addEventListener('click', () => {
      const q = new URLSearchParams({ mode: quiz.mode, go: '1' });
      if (quiz.mode === 'chapter' && quiz.chapter !== 'All') q.set('domain', quiz.chapter);
      if (quiz.mode === 'chapter' && quiz.chapter === 'All') q.set('domain', 'All');
      location.href = 'quiz.html?' + q.toString();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && quiz.open) setQuizOpen(false); });
    $('xqPanel').inert = true;
    renderQuiz();
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
    initQuiz();
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
