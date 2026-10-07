// Practice Exam Blueprint HUD. Percentages and fill widths come from
// EXAM_WEIGHTS in js/exam.js via BlueprintHud.mount(). This file does not
// keep a second copy of the domain weights.
(function () {
  const card = document.getElementById('matrix-exam-card');
  if (!card) return;

  const ROWS = [
    { key: 'Medications', label: 'Medications', slot: 'meds' },
    { key: 'Patient Safety and Quality Assurance', label: 'Patient Safety & Quality', slot: 'safety' },
    { key: 'Order Entry and Processing', label: 'Order Entry & Processing', slot: 'order' },
    { key: 'Federal Requirements', label: 'Federal Requirements', slot: 'federal' }
  ];

  const canvas = card.querySelector('.matrix-canvas');
  const ctx = canvas.getContext('2d');
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'.split('');
  const fontSize = 10;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const intro = document.getElementById('introScreen');
  const eqContainer = card.querySelector('.eq-container');
  const wavePath = card.querySelector('.wave-path');

  let drops = [];
  let timers = [];
  let loopsOn = false;
  let booted = false;
  let orderFraction = 0;
  let waveOffset = 0;

  function fmtPct(n) {
    const v = Number(n);
    if (!isFinite(v)) return '—';
    return v.toFixed(2) + '%';
  }

  function generateHex() {
    return '0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
  }

  function setFill(name, n) {
    if (isFinite(n)) card.style.setProperty(name, n + '%');
  }

  function applyWeights(weights) {
    const parts = ROWS.map(function (row) {
      const n = Number(weights && weights[row.key]);
      const text = fmtPct(n);
      const pctEl = card.querySelector('[data-slot="' + row.slot + '"] .row-percent');
      if (pctEl) pctEl.textContent = text;
      return row.label + ' ' + text;
    });
    card.setAttribute('aria-label', 'Exam blueprint: ' + parts.join(', ') + '.');
    setFill('--meds-fill', Number(weights && weights.Medications));
    setFill('--order-fill', Number(weights && weights['Order Entry and Processing']));
    setFill('--fed-fill', Number(weights && weights['Federal Requirements']));
    const order = Number(weights && weights['Order Entry and Processing']);
    orderFraction = isFinite(order) ? order / 100 : 0;
    if (booted) markEq();
  }

  function initDrops() {
    const columns = Math.max(1, Math.ceil(canvas.width / fontSize));
    drops = [];
    for (let x = 0; x < columns; x++) drops[x] = Math.floor(Math.random() * 8);
  }

  function sizeCanvas() {
    const rect = card.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      initDrops();
    }
  }

  function drawMatrix() {
    if (!ctx || !canvas.width || !canvas.height) return;
    ctx.fillStyle = 'rgba(3, 5, 3, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0F0';
    ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }

  function setupCanvas() {
    sizeCanvas();
    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(function () {
        sizeCanvas();
        if (!loopsOn) drawMatrix();
      });
      resizeObserver.observe(card);
    }
  }

  function lineText() {
    return 'SYS_' + generateHex() + ' // ' + Math.random().toFixed(3);
  }

  function setupTelemetry() {
    const left = card.querySelector('.left-telemetry');
    if (left && !left.children.length) {
      for (let i = 0; i < 10; i++) {
        const d = document.createElement('div');
        d.className = 'sys-line';
        d.textContent = lineText();
        left.appendChild(d);
      }
    }
    const right = card.querySelector('.right-telemetry');
    if (right && !right.querySelector('.dyn-hex')) {
      for (let i = 0; i < 6; i++) {
        const d = document.createElement('div');
        d.className = 'dyn-hex';
        d.textContent = 'SYS: ' + generateHex();
        right.appendChild(d);
      }
    }
  }

  function paintLeft() {
    card.querySelectorAll('.left-telemetry .sys-line').forEach(function (d) {
      d.textContent = lineText();
    });
  }

  function paintRight() {
    card.querySelectorAll('.dyn-hex').forEach(function (d) {
      d.textContent = 'SYS: ' + generateHex();
    });
  }

  function markEq() {
    if (!eqContainer) return 0;
    const activeThreshold = Math.floor(eqContainer.children.length * orderFraction);
    Array.prototype.forEach.call(eqContainer.children, function (bar, i) {
      bar.classList.toggle('active', i < activeThreshold);
    });
    return activeThreshold;
  }

  function paintEq(steady) {
    if (!eqContainer) return;
    const activeThreshold = markEq();
    Array.prototype.forEach.call(eqContainer.children, function (bar, i) {
      if (i < activeThreshold) {
        bar.style.height = (steady ? 70 : Math.floor(Math.random() * 60 + 40)) + '%';
      } else {
        bar.style.height = (steady ? 12 : Math.floor(Math.random() * 20 + 5)) + '%';
      }
    });
  }

  function setupEq() {
    if (!eqContainer || eqContainer.children.length) return;
    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('div');
      bar.className = 'eq-bar';
      eqContainer.appendChild(bar);
    }
    paintEq(true);
  }

  function paintWave(offset) {
    if (!wavePath) return;
    let d = 'M0,10 ';
    for (let i = 0; i <= 300; i += 15) {
      const y = 10 + Math.sin((i + offset) * 0.08) * 8;
      d += 'L' + i + ',' + y.toFixed(2) + ' ';
    }
    wavePath.setAttribute('d', d);
  }

  function motionAllowed() {
    if (motionQuery.matches || document.hidden) return false;
    if (intro && intro.classList.contains('hidden')) return false;
    return true;
  }

  function stopLoops() {
    timers.forEach(clearInterval);
    timers = [];
    loopsOn = false;
  }

  function every(fn, ms) {
    timers.push(setInterval(fn, ms));
  }

  function startLoops() {
    if (loopsOn || !motionAllowed()) return;
    loopsOn = true;
    every(drawMatrix, 40);
    every(paintLeft, 200);
    every(paintRight, 250);
    every(function () { paintEq(false); }, 120);
    every(function () {
      waveOffset -= 2;
      paintWave(waveOffset);
    }, 40);
  }

  function holdStaticFrame() {
    stopLoops();
    sizeCanvas();
    drawMatrix();
    paintLeft();
    paintRight();
    paintEq(true);
    paintWave(0);
  }

  function syncMotion() {
    const allow = motionAllowed();
    card.classList.toggle('is-paused', !allow);
    if (allow) startLoops();
    else holdStaticFrame();
  }

  function mount(weights) {
    applyWeights(weights || {});
    if (!booted) {
      booted = true;
      setupCanvas();
      setupTelemetry();
      setupEq();
      paintWave(0);
      document.addEventListener('visibilitychange', syncMotion);
      if (intro && typeof MutationObserver === 'function') {
        new MutationObserver(syncMotion).observe(intro, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', syncMotion);
      }
      syncMotion();
    }
  }

  window.BlueprintHud = { mount: mount };
})();
