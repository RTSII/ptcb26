// Shared utilities for PTCE 2026 Study App
const Storage = (() => {
  const KEY = 'ptce2026_progress_v1';
  const idStr = (id) => String(id);
  const defaults = () => ({
    flashcards: { known: [], unknown: [], reviewed: [] },
    // spaced-repetition box per card id: { [id]: { box: 1-5, due: ISO } }
    cardState: {},
    // bookmarks
    bookmarkedQuestions: [],
    bookmarkedCards: [],
    // missed questions: { [id]: { wrong: n, last: ISO } }
    missed: {},
    // course progress: completed lesson ids + last-opened lesson
    course: { completed: [], lastLesson: null },
    quizzes: [],
    exams: [],
    lastVisit: null
  });
  const read = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const data = JSON.parse(raw);
      return {
        flashcards: {
          known: Array.isArray(data.flashcards?.known) ? data.flashcards.known.map(idStr) : [],
          unknown: Array.isArray(data.flashcards?.unknown) ? data.flashcards.unknown.map(idStr) : [],
          reviewed: Array.isArray(data.flashcards?.reviewed) ? data.flashcards.reviewed.map(idStr) : []
        },
        cardState: (data.cardState && typeof data.cardState === 'object') ? data.cardState : {},
        bookmarkedQuestions: Array.isArray(data.bookmarkedQuestions) ? data.bookmarkedQuestions.map(idStr) : [],
        bookmarkedCards: Array.isArray(data.bookmarkedCards) ? data.bookmarkedCards.map(idStr) : [],
        missed: (data.missed && typeof data.missed === 'object') ? data.missed : {},
        course: {
          completed: Array.isArray(data.course?.completed) ? data.course.completed : [],
          lastLesson: data.course?.lastLesson || null
        },
        quizzes: Array.isArray(data.quizzes) ? data.quizzes : [],
        exams: Array.isArray(data.exams) ? data.exams : [],
        lastVisit: data.lastVisit || null
      };
    } catch {
      return defaults();
    }
  };
  const write = (data) => localStorage.setItem(KEY, JSON.stringify(data));
  const touch = () => { const d = read(); d.lastVisit = new Date().toISOString(); write(d); };
  const recordQuiz = (attempt) => {
    const d = read();
    d.quizzes.unshift(attempt);
    // capture missed questions for review mode
    (attempt.questions || []).forEach(r => {
      if (r.correct) delete d.missed[r.id];
      else {
        const m = d.missed[r.id] || { wrong: 0, last: null };
        m.wrong++; m.last = new Date().toISOString(); d.missed[r.id] = m;
      }
    });
    write(d);
  };
  const recordExam = (attempt) => {
    const d = read();
    d.exams.unshift(attempt);
    (attempt.questions || []).forEach(r => {
      if (r.correct) delete d.missed[r.id];
      else {
        const m = d.missed[r.id] || { wrong: 0, last: null };
        m.wrong++; m.last = new Date().toISOString(); d.missed[r.id] = m;
      }
    });
    write(d);
  };
  const setFlashStatus = (id, status) => {
    id = idStr(id);
    const d = read();
    const { known, unknown } = d.flashcards;
    const inKnown = known.includes(id);
    const inUnknown = unknown.includes(id);
    if (status === 'known') {
      if (!inKnown) known.push(id);
      if (inUnknown) d.flashcards.unknown = unknown.filter(x => x !== id);
    } else if (status === 'unknown') {
      if (!inUnknown) unknown.push(id);
      if (inKnown) d.flashcards.known = known.filter(x => x !== id);
    }
    write(d);
  };
  const markReviewed = (id) => {
    id = idStr(id);
    const d = read();
    if (!d.flashcards.reviewed.includes(id)) {
      d.flashcards.reviewed.push(id);
      write(d);
    }
  };
  // ---- Bookmarks ----
  const toggleBookmark = (kind, id) => {
    id = idStr(id);
    const d = read();
    const key = kind === 'card' ? 'bookmarkedCards' : 'bookmarkedQuestions';
    const arr = d[key];
    const i = arr.indexOf(id);
    if (i === -1) arr.push(id); else arr.splice(i, 1);
    write(d);
    return i === -1;
  };
  const isBookmarked = (kind, id) => {
    const d = read();
    return (kind === 'card' ? d.bookmarkedCards : d.bookmarkedQuestions).includes(idStr(id));
  };
  const getBookmarks = (kind) => {
    const d = read();
    return kind === 'card' ? d.bookmarkedCards.slice() : d.bookmarkedQuestions.slice();
  };
  // ---- Missed questions ----
  const recordQuestionOutcome = (id, correct) => {
    id = idStr(id);
    const d = read();
    if (correct) {
      delete d.missed[id];
    } else {
      const m = d.missed[id] || { wrong: 0, last: null };
      m.wrong++;
      m.last = new Date().toISOString();
      d.missed[id] = m;
    }
    write(d);
  };
  const getMissed = () => Object.keys(read().missed);
  const clearMissed = () => {
    const d = read();
    d.missed = {};
    write(d);
  };
  const clearBookmarks = (kind) => {
    const d = read();
    if (kind === 'card') d.bookmarkedCards = [];
    else if (kind === 'question') d.bookmarkedQuestions = [];
    else {
      d.bookmarkedQuestions = [];
      d.bookmarkedCards = [];
    }
    write(d);
  };
  // ---- Spaced repetition (Leitner) ----
  const BOX_INTERVALS = [0, 1, 2, 4, 7, 15]; // days per box index 1..5
  const gradeCard = (id, knew) => {
    id = idStr(id);
    const d = read();
    const s = d.cardState[id] || { box: 1, due: null };
    s.box = knew ? Math.min(5, s.box + 1) : 1;
    const days = BOX_INTERVALS[s.box];
    s.due = new Date(Date.now() + days * 86400000).toISOString();
    d.cardState[id] = s;
    // keep known/unknown in sync
    if (knew) {
      if (!d.flashcards.known.includes(id)) d.flashcards.known.push(id);
      d.flashcards.unknown = d.flashcards.unknown.filter(x => x !== id);
    } else {
      if (!d.flashcards.unknown.includes(id)) d.flashcards.unknown.push(id);
      d.flashcards.known = d.flashcards.known.filter(x => x !== id);
    }
    write(d);
  };
  const dueCards = (allIds) => {
    const d = read();
    const now = Date.now();
    return allIds.map(idStr).filter(id => {
      const s = d.cardState[id];
      if (!s) return true;                       // never studied
      if (d.flashcards.unknown.includes(id)) return true;
      return !s.due || new Date(s.due).getTime() <= now;
    });
  };
  // ---- Export / import ----
  const exportJSON = () => JSON.stringify(read(), null, 2);
  const importJSON = (text) => {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || !Array.isArray(data.quizzes)) {
      throw new Error('Invalid progress file');
    }
    write(data);
    return true;
  };
  // ---- Course progress ----
  const markLessonComplete = (lessonId) => {
    const d = read();
    if (!d.course.completed.includes(lessonId)) {
      d.course.completed.push(lessonId);
      write(d);
    }
  };
  const setLastLesson = (lessonId) => {
    const d = read();
    d.course.lastLesson = lessonId;
    write(d);
  };
  const getCourseProgress = () => {
    const d = read();
    return { completed: d.course.completed.slice(), lastLesson: d.course.lastLesson };
  };
  const clear = () => localStorage.removeItem(KEY);
  return {
    read, write, touch, recordQuiz, recordExam, setFlashStatus, markReviewed, clear,
    toggleBookmark, isBookmarked, getBookmarks, recordQuestionOutcome, getMissed,
    clearMissed, clearBookmarks,
    gradeCard, dueCards, exportJSON, importJSON,
    markLessonComplete, setLastLesson, getCourseProgress
  };
})();

const Util = (() => {
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sample = (arr, n) => {
    const s = shuffle(arr);
    return s.slice(0, Math.min(n, s.length));
  };
  const groupBy = (arr, key) => arr.reduce((m, x) => {
    const k = typeof key === 'function' ? key(x) : x[key];
    (m[k] = m[k] || []).push(x);
    return m;
  }, {});
  const pct = (num, den) => (den ? Math.round((num / den) * 100) : 0);
  const el = (sel, root = document) => root.querySelector(sel);
  const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const escapeHtml = (s) => (s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
  const formatDuration = (ms) => {
    if (!ms || ms < 0) return '—';
    const sec = Math.round(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };
  const fetchJSON = async (path) => {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  };
  return { shuffle, sample, groupBy, pct, el, els, escapeHtml, formatDuration, fetchJSON };
})();

const DOMAINS = ['Medications', 'Patient Safety and Quality Assurance', 'Order Entry and Processing', 'Federal Requirements'];

// Matrix rain. Home and the progress dashboard use a brighter code field.
// Other pages keep the lighter ambient rain. Reduced motion skips the canvas.
const FX = (() => {
  const AMBIENT = 'アカサタナハマヤラワ0123456789ABCDEFXYZ$#%&';
  const MATRIX = 'アカサタナハマヤラワアイウエオカキクケコ0101$#%&{}[]<>';
  let canvas, ctx, drops, rafId, lastT = 0;
  let font = 15;
  const INTERVAL = 66;

  let homeCols = null;

  function matrixStage() {
    const b = document.body;
    return !!(b && (b.classList.contains('home') || b.classList.contains('dashboard')));
  }

  function homeStage() {
    return !!(document.body && document.body.classList.contains('home'));
  }

  // Home rain: top-to-bottom fade, 3D depth layers, and perspective horizon.
  // The top 20% is clear for header/titles. Rain intensifies down into the negative spaces.
  function homeFade(py) {
    const p = py / (canvas.height / (window.devicePixelRatio || 1));
    if (p < 0.18) return 0;
    if (p < 0.38) return (p - 0.18) / 0.20;
    if (p < 0.75) return 1;
    return Math.max(0.35, 1 - (p - 0.75) * 0.8);
  }

  function paintHomeColumns(seed) {
    const dpr = window.devicePixelRatio || 1;
    const viewHeight = canvas.height / dpr;

    homeCols.forEach((col, i) => {
      const x = i * font;
      const head = Math.floor(col.y);
      const steps = seed ? col.trail : (col.layer === 2 ? 6 : 4);
      
      // Layer aesthetics: 0 = far/dim, 1 = mid, 2 = near/bright
      let baseColor = '#0b6628';
      let depthAlpha = 0.35;
      if (col.layer === 1) {
        baseColor = '#00ff41';
        depthAlpha = 0.75;
      } else if (col.layer === 2) {
        baseColor = '#38ff6c';
        depthAlpha = 1.0;
      }

      for (let k = 0; k < steps; k++) {
        const row = head - k;
        const py = row * font;
        if (py < -font || py > viewHeight + font) continue;
        const fade = homeFade(py);
        if (fade <= 0) continue;

        const isLead = (k === 0);
        let alpha = (isLead ? 1 : Math.max(0.12, 0.85 - k * 0.08)) * depthAlpha * fade;
        ctx.globalAlpha = Math.min(1, alpha);

        if (isLead && col.layer >= 1) {
          ctx.fillStyle = '#f4fff6';
          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = col.layer === 2 ? 8 : 4;
        } else {
          ctx.fillStyle = baseColor;
          ctx.shadowBlur = 0;
        }

        const ch = MATRIX[(i * 17 + row * 11) % MATRIX.length];
        ctx.fillText(ch, x, py);
      }
      ctx.shadowBlur = 0;

      if (!seed) {
        col.y += col.speed;
        if (col.y * font > viewHeight + col.trail * font && Math.random() > 0.96) {
          col.y = 0;
        }
      }
    });
  }

  // 3D perspective floor in negative space at bottom
  function paintHomeFloor() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const vanishX = w * 0.5;
    const vanishY = h * 0.58;
    const rays = 18;
    const rows = 9;
    const tick = Math.floor((lastT || 0) / 120);

    ctx.save();
    for (let r = 0; r < rays; r++) {
      const side = (r / (rays - 1)) * 2 - 1;
      for (let row = 0; row < rows; row++) {
        const depth = (row + 1) / rows;
        const y = vanishY + depth * depth * (h - vanishY);
        const x = vanishX + side * depth * w * 0.48;
        const size = Math.round(9 + depth * 14);

        ctx.globalAlpha = (0.08 + depth * 0.65) * Math.min(1, depth * 1.2);
        ctx.font = `${size}px "JetBrains Mono", "Share Tech Mono", monospace`;
        ctx.fillStyle = depth > 0.88 ? '#eaffef' : (depth > 0.65 ? '#00ff41' : '#085e23');
        const ch = MATRIX[(r * 7 + row * 5 + tick) % MATRIX.length];
        ctx.fillText(ch, x, y);
      }
    }
    ctx.restore();
    ctx.font = `${font}px "JetBrains Mono", "Share Tech Mono", monospace`;
  }

  function paintHome(seed) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    if (seed) {
      ctx.fillStyle = '#010a06';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = 'rgba(1, 10, 6, 0.11)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.font = `${font}px "JetBrains Mono", "Share Tech Mono", monospace`;
    paintHomeColumns(seed);
    paintHomeFloor();
    ctx.globalAlpha = 1;
  }

  function seedHomeColumns() {
    const dpr = window.devicePixelRatio || 1;
    const cols = Math.ceil((canvas.width / dpr) / font);
    const rows = Math.ceil((canvas.height / dpr) / font);
    homeCols = Array.from({ length: cols }, (_, i) => {
      // 3 distinct layers: 0=dim background, 1=standard midground, 2=sharp fast foreground
      const r = Math.random();
      const layer = r < 0.45 ? 0 : (r < 0.82 ? 1 : 2);
      const speed = layer === 0 ? 0.45 : (layer === 1 ? 0.85 : 1.45);
      const trail = layer === 0 ? 18 : (layer === 1 ? 14 : 10);
      return {
        y: Math.random() * rows,
        speed,
        trail,
        layer
      };
    });
  }

  function resize() {
    const matrix = matrixStage();
    const home = homeStage();
    const dpr = window.devicePixelRatio || 1;
    font = matrix ? 16 : 15;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const cols = Math.ceil(window.innerWidth / font);
    const rows = Math.ceil(window.innerHeight / font);
    ctx.font = `${font}px "JetBrains Mono", "Share Tech Mono", monospace`;

    if (home) {
      seedHomeColumns();
      paintHome(true);
      return;
    }
    homeCols = null;
    drops = Array.from({ length: cols }, () => Math.floor(Math.random() * rows));
    if (!matrix) return;
    ctx.fillStyle = '#010a06';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < cols; i++) {
      const head = drops[i];
      for (let row = 0; row < rows; row++) {
        const dist = (head - row + rows) % rows;
        if (dist > 16) continue;
        const ch = MATRIX[(i * 13 + row * 7) % MATRIX.length];
        ctx.fillStyle = dist === 0 ? '#f4fff6' : '#22ff57';
        ctx.globalAlpha = dist === 0 ? 1 : Math.max(0.22, 0.78 - dist * 0.04);
        ctx.fillText(ch, i * font, row * font);
      }
    }
    ctx.globalAlpha = 1;
  }

  function draw(t) {
    rafId = requestAnimationFrame(draw);
    if (t - lastT < INTERVAL) return;
    lastT = t;
    const matrix = matrixStage();
    if (homeStage()) {
      paintHome(false);
      return;
    }
    ctx.fillStyle = matrix ? 'rgba(0, 14, 5, 0.07)' : 'rgba(3, 0, 20, 0.14)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = font + 'px "Share Tech Mono", monospace';
    const chars = matrix ? MATRIX : AMBIENT;
    drops.forEach((y, i) => {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const x = i * font;
      const head = matrix || Math.random() < 0.06;
      if (matrix) {
        ctx.fillStyle = '#f4fff6';
        ctx.globalAlpha = 1;
        ctx.fillText(ch, x, y * font);
        ctx.fillStyle = '#1ee852';
        ctx.globalAlpha = 0.55;
        ctx.fillText(chars[(i + y) % chars.length], x, (y - 1) * font);
      } else {
        ctx.fillStyle = head ? '#b4ffb9' : '#00ff41';
        ctx.globalAlpha = head ? 0.9 : 0.55;
        ctx.fillText(ch, x, y * font);
      }
      ctx.globalAlpha = 1;
      if (y * font > canvas.height && Math.random() > 0.975) drops[i] = 0;
      else drops[i] = y + 1;
    });
  }

  function start() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    canvas = document.createElement('canvas');
    canvas.id = 'matrixRain';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else { lastT = 0; rafId = requestAnimationFrame(draw); }
    });
    rafId = requestAnimationFrame(draw);
  }

  return { start };
})();

window.App = { Storage, Util, DOMAINS, FX };

function renderHomeProgress() {
  const root = document.getElementById('homeProgress');
  if (!root) return;
  const p = Storage.read();
  const scoreOf = (a) => (typeof a.score === 'number' ? a.score : Util.pct(a.correct || 0, a.total || 0));
  const quizzes = p.quizzes.length;
  const avg = quizzes
    ? Math.round(p.quizzes.reduce((sum, attempt) => sum + scoreOf(attempt), 0) / quizzes)
    : null;
  const cards = p.flashcards.reviewed.length;
  const exams = p.exams.length;
  const lessons = p.course && Array.isArray(p.course.completed) ? p.course.completed.length : 0;
  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  set('homeQuizzes', String(quizzes));
  set('homeAvg', avg == null ? '—' : avg + '%');
  set('homeCards', String(cards));
  set('homeExams', String(exams));
  set('homeLessons', String(lessons));
  const snap = document.getElementById('homeProgressSnap');
  if (snap) {
    snap.textContent = quizzes + ' quizzes · ' + (avg == null ? '— avg' : avg + '% avg') +
      ' · ' + cards + ' cards · ' + exams + ' exams';
  }
}

function bootShell() {
  FX.start();
  renderHomeProgress();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootShell);
} else {
  bootShell();
}

// Offline/PWA support. Skip registration on local dev hosts so python -m http.server
// picks up HTML/CSS/JS on a normal refresh. One visit also drops a SW left over
// from an earlier session.
(function () {
  if (!('serviceWorker' in navigator)) return;

  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  if (isLocal) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
      .catch(() => {});
    if (window.caches && typeof caches.keys === 'function') {
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {});
    }
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
})();
