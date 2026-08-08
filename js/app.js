// Shared utilities for PTCE 2026 Study App
const Storage = (() => {
  const KEY = 'ptce2026_progress_v1';
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
          known: Array.isArray(data.flashcards?.known) ? data.flashcards.known : [],
          unknown: Array.isArray(data.flashcards?.unknown) ? data.flashcards.unknown : [],
          reviewed: Array.isArray(data.flashcards?.reviewed) ? data.flashcards.reviewed : []
        },
        cardState: (data.cardState && typeof data.cardState === 'object') ? data.cardState : {},
        bookmarkedQuestions: Array.isArray(data.bookmarkedQuestions) ? data.bookmarkedQuestions : [],
        bookmarkedCards: Array.isArray(data.bookmarkedCards) ? data.bookmarkedCards : [],
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
    const d = read();
    if (!d.flashcards.reviewed.includes(id)) {
      d.flashcards.reviewed.push(id);
      write(d);
    }
  };
  // ---- Bookmarks ----
  const toggleBookmark = (kind, id) => {
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
    return (kind === 'card' ? d.bookmarkedCards : d.bookmarkedQuestions).includes(id);
  };
  const getBookmarks = (kind) => {
    const d = read();
    return kind === 'card' ? d.bookmarkedCards.slice() : d.bookmarkedQuestions.slice();
  };
  // ---- Missed questions ----
  const recordQuestionOutcome = (id, correct) => {
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
  // ---- Spaced repetition (Leitner) ----
  const BOX_INTERVALS = [0, 1, 2, 4, 7, 15]; // days per box index 1..5
  const gradeCard = (id, knew) => {
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
    return allIds.filter(id => {
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

// Matrix rain background FX (subtle, respects reduced-motion)
const FX = (() => {
  const CHARS = 'アカサタナハマヤラワ0123456789ABCDEFXYZ$#%&';
  let canvas, ctx, drops, rafId, lastT = 0;
  const FONT = 15;
  const INTERVAL = 66;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.ceil(canvas.width / FONT);
    drops = Array.from({ length: cols }, () => Math.floor(Math.random() * canvas.height / FONT));
  }

  function draw(t) {
    rafId = requestAnimationFrame(draw);
    if (t - lastT < INTERVAL) return;
    lastT = t;
    ctx.fillStyle = 'rgba(3, 0, 20, 0.14)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = FONT + 'px "Share Tech Mono", monospace';
    drops.forEach((y, i) => {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x = i * FONT;
      const bright = Math.random() < 0.06;
      ctx.fillStyle = bright ? '#b4ffb9' : '#00ff41';
      ctx.globalAlpha = bright ? 0.9 : 0.55;
      ctx.fillText(ch, x, y * FONT);
      ctx.globalAlpha = 1;
      if (y * FONT > canvas.height && Math.random() > 0.976) drops[i] = 0;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', FX.start);
} else {
  FX.start();
}

// Register service worker for offline/PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
