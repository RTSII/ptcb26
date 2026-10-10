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
  const MATRIX_GLYPHS = 'アカサタナハマヤラワアイウエオカキクケコ0101$#%&{}[]<>0123456789ABCDEF';
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

  // Home rain is composed: a quiet header band, two depths of vertical code
  // through the panel gaps, smoothly fading out toward the bottom without a static grid.
  function homeFade(py) {
    const p = py / canvas.height;
    if (p < 0.10) return 0;
    if (p < 0.28) return (p - 0.10) / 0.18;
    if (p < 0.62) return 1;
    return Math.max(0.25, 1 - (p - 0.62) / 0.55);
  }

  function paintHomeColumns(seed) {
    homeCols.forEach((col, i) => {
      const x = i * font;
      const head = Math.floor(col.y);
      const steps = seed ? col.trail : 3;
      const depth = col.layer === 0 ? 0.38 : 1;
      for (let k = 0; k < steps; k++) {
        const row = head - k;
        const py = row * font;
        if (py < -font || py > canvas.height + font) continue;
        const fade = homeFade(py);
        if (fade <= 0) continue;
        const lead = k === 0;
        let alpha = (lead ? 1 : Math.max(0.12, 0.72 - k * 0.055)) * depth * fade;
        if (lead) alpha = Math.min(1, alpha * (0.7 + (py / canvas.height) * 0.45));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = lead ? '#f4fff6' : (col.layer === 0 ? '#0c7a30' : '#2ee85a');
        const ch = MATRIX_GLYPHS[(i * 13 + row * 7) % MATRIX_GLYPHS.length];
        ctx.fillText(ch, x, py);
      }
      if (!seed) {
        col.y += col.speed;
        if (col.y * font > canvas.height + col.trail * font && Math.random() > 0.965) col.y = 0;
      }
    });
  }

  function paintHome(seed) {
    if (seed) {
      ctx.fillStyle = '#010a06';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = 'rgba(1, 10, 6, 0.09)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.font = font + 'px "Share Tech Mono", monospace';
    paintHomeColumns(seed);
    ctx.globalAlpha = 1;
  }

  function seedHomeColumns() {
    const cols = Math.ceil(canvas.width / font);
    const rows = Math.ceil(canvas.height / font);
    homeCols = Array.from({ length: cols }, (_, i) => {
      const far = i % 2 === 0;
      return {
        y: Math.random() * rows,
        speed: far ? 0.55 : 1,
        trail: far ? 16 : 12,
        layer: far ? 0 : 1
      };
    });
  }

  function resize() {
    const matrix = matrixStage();
    const home = homeStage();
    font = matrix ? 16 : 15;
    const courseScroll = document.body.classList.contains('course') &&
      !document.body.classList.contains('lesson-open');
    canvas.width = window.innerWidth;
    canvas.height = courseScroll
      ? Math.max(window.innerHeight, document.documentElement.scrollHeight)
      : window.innerHeight;
    const cols = Math.ceil(canvas.width / font);
    const rows = Math.ceil(canvas.height / font);
    ctx.font = font + 'px "Share Tech Mono", monospace';
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
        const ch = MATRIX_GLYPHS[(i * 13 + row * 7) % MATRIX_GLYPHS.length];
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
    const chars = MATRIX_GLYPHS;
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
  set('homeQuizzesCore', String(quizzes));
  set('homeAvgCore', avg == null ? '—' : avg + '%');
  set('homeCardsCore', String(cards));
  const snap = document.getElementById('homeProgressSnap');
  if (snap) {
    snap.textContent = quizzes + ' quizzes · ' + (avg == null ? '— avg' : avg + '% avg') +
      ' · ' + cards + ' cards · ' + exams + ' exams';
  }
}

function bootShell() {
  // Dashboard is a plain dark field. Do not start the rain canvas there.
  if (!document.body.classList.contains('dashboard')) FX.start();
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
