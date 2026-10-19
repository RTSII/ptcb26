#!/usr/bin/env node
'use strict';
/**
 * Page overflow. Invoked by validate.js.
 * Loads every top-level page at 1600x770 (primary) and 1366x768
 * (secondary) twice: a fresh profile (no saved progress), then the
 * glance screens again with heavy progress in localStorage.
 * Fails when the document, the body, or the page's main container
 * overflows by more than half a pixel, unless that page is allowlisted
 * for that pass.
 *
 * The empty pass has no allowlist. Do not hide a phantom scrollbar.
 * The heavy pass allowlists only the Progress Dashboard. It scrolls
 * with live data, and that fix is deferred in TODO.md.
 *
 * Run: node check-page-fit.js
 * Chrome: CHROME_PATH, or google-chrome / chromium on PATH.
 */
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const SIZES = [[1600, 770], [1366, 768]];
const PAGES = [
  '/index.html',
  '/dashboard.html',
  '/course.html',
  '/notes.html',
  '/quiz.html',
  '/exam.html',
  '/flashcards.html'
];
const GLANCE = PAGES.slice();
const PROGRESS_KEY = 'ptce2026_progress_v1';
// Heavy-data page scroll that is already deferred. Do not add a page
// here to hide a new overflow. Other glance failures stay failures.
const HEAVY_ALLOW = new Map([
  ['/dashboard.html', 'Progress Dashboard scrolls with live data. Fix deferred in TODO.md (Dashboard live-data scroll). Expected.']
]);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const MEASURE = `(() => {
  const se = document.scrollingElement || document.documentElement;
  const body = document.body;
  const main = document.querySelector('main');
  function scrollPx(el) {
    if (!el) return 0;
    el.scrollTop = el.scrollHeight;
    const moved = el.scrollTop;
    el.scrollTop = 0;
    return Math.max(el.scrollHeight - el.clientHeight, moved);
  }
  const docPx = scrollPx(se);
  const bodyPx = scrollPx(body);
  const mainPx = scrollPx(main);
  const path = location.pathname;
  let seedQuizzes = 0;
  try {
    const raw = localStorage.getItem('ptce2026_progress_v1');
    if (raw) seedQuizzes = (JSON.parse(raw).quizzes || []).length;
  } catch (e) { seedQuizzes = 0; }
  let settled = document.readyState === 'complete';
  if (path.endsWith('/course.html')) settled = settled && !!document.querySelector('#courseList .nx-domain-card');
  if (path.endsWith('/notes.html')) settled = settled && !!document.querySelector('#notesArea .nx-domain-card');
  if (path.endsWith('/dashboard.html')) {
    settled = settled && !!document.querySelector('#domainAccuracy .domain-row, #domainAccuracy p');
    if (seedQuizzes > 0) settled = settled && !!document.querySelector('#quizHistory .hist-row');
  }
  if (path.endsWith('/flashcards.html')) {
    settled = settled && !!document.querySelector('#flashcard') && !!document.querySelector('#filterRow .pill');
  }
  if (path.endsWith('/index.html')) {
    settled = settled && !!document.querySelector('.hx-grid');
    const next = document.querySelector('#hxCourseNext');
    if (next && /Loading course map/.test(next.textContent || '')) settled = false;
    if (seedQuizzes > 0) {
      const qz = document.querySelector('#homeQuizzes');
      if (!qz || !qz.textContent || qz.textContent === '0') settled = false;
    }
  }
  if (path.endsWith('/quiz.html')) settled = settled && !!document.querySelector('#setup');
  if (path.endsWith('/exam.html')) settled = settled && !!document.querySelector('#introScreen #lenGroup .xs-opt');
  const overflow = Math.max(docPx, bodyPx, mainPx);
  return {
    settled: settled,
    overflow: overflow,
    doc: docPx,
    body: bodyPx,
    main: mainPx,
    seedQuizzes: seedQuizzes
  };
})()`;

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const names = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    for (const name of names) {
      const full = path.join(dir, name);
      if (fs.existsSync(full)) return full;
    }
  }
  const fixed = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  return fixed.find((p) => fs.existsSync(p)) || null;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function encodeFrame(payload, opcode) {
  const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const mask = crypto.randomBytes(4);
  let header;
  if (body.length < 126) {
    header = Buffer.from([0x80 | opcode, 0x80 | body.length]);
  } else if (body.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(body.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(body.length), 2);
  }
  const masked = Buffer.alloc(body.length);
  for (let i = 0; i < body.length; i++) masked[i] = body[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

function connectCdp(wsUrl) {
  const u = new URL(wsUrl);
  return new Promise((resolve, reject) => {
    const sock = net.connect(Number(u.port), u.hostname);
    const key = crypto.randomBytes(16).toString('base64');
    let buf = Buffer.alloc(0);
    let up = false;
    let frag = null;
    const pending = new Map();
    let nextId = 0;
    const api = {
      call(method, params, timeoutMs) {
        const id = ++nextId;
        return new Promise((res, rej) => {
          const timer = setTimeout(() => {
            pending.delete(id);
            rej(new Error('timeout ' + method));
          }, timeoutMs || 20000);
          pending.set(id, { res, rej, timer });
          sock.write(encodeFrame(JSON.stringify({ id, method, params: params || {} }), 1));
        });
      },
      close() { sock.end(); }
    };
    function onText(text) {
      let msg;
      try { msg = JSON.parse(text); } catch (e) { return; }
      const waiter = msg.id && pending.get(msg.id);
      if (!waiter) return;
      clearTimeout(waiter.timer);
      pending.delete(msg.id);
      if (msg.error) waiter.rej(new Error(JSON.stringify(msg.error)));
      else waiter.res(msg.result);
    }
    function drain() {
      while (up && buf.length >= 2) {
        const opcode = buf[0] & 0x0f;
        const fin = buf[0] & 0x80;
        let len = buf[1] & 0x7f;
        let off = 2;
        if (len === 126) {
          if (buf.length < 4) return;
          len = buf.readUInt16BE(2);
          off = 4;
        } else if (len === 127) {
          if (buf.length < 10) return;
          len = Number(buf.readBigUInt64BE(2));
          off = 10;
        }
        if (buf.length < off + len) return;
        const payload = buf.slice(off, off + len);
        buf = buf.slice(off + len);
        if (opcode === 0x9) {
          sock.write(encodeFrame(payload, 0xA));
          continue;
        }
        if (opcode === 0x8) continue;
        if (opcode === 0x1 || opcode === 0x0) {
          frag = frag ? Buffer.concat([frag, payload]) : payload;
          if (fin) {
            onText(frag.toString());
            frag = null;
          }
        }
      }
    }
    sock.on('error', reject);
    sock.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (!up) {
        const idx = buf.indexOf('\r\n\r\n');
        if (idx < 0) return;
        const head = buf.slice(0, idx).toString();
        if (!/ 101 /.test(head)) {
          reject(new Error('devtools upgrade failed: ' + head.split('\r\n')[0]));
          sock.end();
          return;
        }
        buf = buf.slice(idx + 4);
        up = true;
        resolve(api);
      }
      drain();
    });
    sock.on('connect', () => {
      const reqPath = u.pathname + u.search;
      sock.write(
        'GET ' + reqPath + ' HTTP/1.1\r\n' +
        'Host: ' + u.host + '\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        'Sec-WebSocket-Key: ' + key + '\r\n' +
        'Sec-WebSocket-Version: 13\r\n\r\n'
      );
    });
  });
}

async function waitJson(port) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch('http://127.0.0.1:' + port + '/json/list');
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) return page;
      }
    } catch (e) { /* chrome still starting */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Chrome DevTools did not open a page');
}

async function measure(cdp) {
  await cdp.call('Runtime.evaluate', {
    expression: 'document.fonts ? document.fonts.ready : Promise.resolve()',
    awaitPromise: true
  });
  let last = null;
  let stable = 0;
  for (let i = 0; i < 40; i++) {
    const ev = await cdp.call('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    const value = ev && ev.result && ev.result.value;
    if (value && value.settled && last &&
        Math.abs(value.overflow - last.overflow) < 0.5 &&
        Math.abs(value.main - last.main) < 0.5) {
      stable++;
      if (stable >= 2) return value;
    } else {
      stable = 0;
    }
    last = value;
    await new Promise((r) => setTimeout(r, 100));
  }
  return last;
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

// Real storage shape from js/app.js Storage.defaults / recordQuiz / recordExam.
// The schema has no streak counter. A streak is 21 consecutive days of quizzes
// ending today, plus lastVisit today.
function buildHeavyProgress() {
  const course = loadJson('data/course.json');
  const questions = loadJson('data/questions.json').questions || [];
  const cards = loadJson('data/flashcards.json').cards || [];
  const domains = [
    'Medications',
    'Patient Safety and Quality Assurance',
    'Order Entry and Processing',
    'Federal Requirements'
  ];
  const featured = [];
  (course.modules || []).forEach((mod) => {
    (mod.lessons || []).forEach((lesson) => {
      if (!lesson.optional) featured.push(lesson);
    });
  });
  const resumeLesson = featured.reduce((best, lesson) => {
    return (lesson.title || '').length > (best.title || '').length ? lesson : best;
  }, featured[0]);
  const completed = featured.filter((lesson) => lesson.id !== resumeLesson.id).map((lesson) => lesson.id);

  const missed = {};
  questions.slice(0, 48).forEach((q, i) => {
    missed[String(q.id)] = { wrong: (i % 4) + 1, last: isoDaysAgo(i % 21) };
  });
  const bookmarkedQuestions = questions.slice(10, 80).map((q) => String(q.id));
  const bookmarkedCards = cards.slice(0, 50).map((card) => String(card.id));
  const reviewed = cards.map((card) => String(card.id));
  const known = cards.slice(0, Math.floor(cards.length * 0.7)).map((card) => String(card.id));
  const knownSet = new Set(known);
  const unknown = reviewed.filter((id) => !knownSet.has(id));
  const cardState = {};
  cards.forEach((card, i) => {
    const box = (i % 5) + 1;
    const due = new Date(Date.now() + (i % 3 === 0 ? -86400000 : box * 86400000)).toISOString();
    cardState[String(card.id)] = { box: box, due: due };
  });

  const quizzes = [];
  for (let day = 0; day < 21; day++) {
    const qs = [];
    for (let k = 0; k < 10; k++) {
      const q = questions[(day * 5 + k) % questions.length];
      qs.push({ id: String(q.id), correct: (k + day) % 4 !== 0 });
    }
    const correct = qs.filter((row) => row.correct).length;
    const chapter = day % 2 === 0;
    quizzes.push({
      date: isoDaysAgo(day),
      mode: chapter ? 'chapter' : 'quick10',
      domain: chapter ? domains[day % domains.length] : null,
      subtopic: null,
      total: qs.length,
      correct: correct,
      score: Math.round((correct / qs.length) * 100),
      duration: 240000 + day * 1000,
      questions: qs
    });
  }

  const exams = [];
  for (let i = 0; i < 6; i++) {
    const qs = [];
    for (let k = 0; k < 90; k++) {
      const q = questions[(i * 13 + k) % questions.length];
      qs.push({ id: String(q.id), correct: (k + i) % 5 !== 0 });
    }
    const correct = qs.filter((row) => row.correct).length;
    const score = Math.round((correct / qs.length) * 100);
    exams.push({
      date: isoDaysAgo(i * 3),
      mode: 'exam',
      total: qs.length,
      correct: correct,
      score: score,
      scaled: Math.round(1000 + (score / 100) * 600),
      duration: 110 * 60 * 1000,
      questions: qs
    });
  }

  return {
    progress: {
      flashcards: { known: known, unknown: unknown, reviewed: reviewed },
      cardState: cardState,
      bookmarkedQuestions: bookmarkedQuestions,
      bookmarkedCards: bookmarkedCards,
      missed: missed,
      course: { completed: completed, lastLesson: resumeLesson.id },
      quizzes: quizzes,
      exams: exams,
      lastVisit: new Date().toISOString()
    },
    summary: {
      lessons: completed.length,
      resume: resumeLesson.title,
      quizzes: quizzes.length,
      streakDays: 21,
      exams: exams.length,
      missed: Object.keys(missed).length,
      bookmarkedQuestions: bookmarkedQuestions.length,
      bookmarkedCards: bookmarkedCards.length,
      reviewed: reviewed.length
    }
  };
}

function heavySeedSource(progress) {
  const payload = JSON.stringify(progress);
  return 'try{localStorage.setItem(' + JSON.stringify(PROGRESS_KEY) + ',' + JSON.stringify(payload) + ');}catch(e){}';
}

async function runPass(cdp, httpPort, passName, pages, allow, expectSeed) {
  const failures = [];
  const allowedOverflows = [];
  for (const size of SIZES) {
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: size[0],
      height: size[1],
      deviceScaleFactor: 1,
      mobile: false
    });
    for (const rel of pages) {
      const label = passName + ' ' + size[0] + 'x' + size[1] + ' ' + rel;
      await cdp.call('Page.navigate', { url: 'http://127.0.0.1:' + httpPort + rel });
      const value = await measure(cdp);
      if (!value || !value.settled) {
        const line = label + ': page did not render';
        console.error('FAIL ' + line);
        failures.push(line);
        continue;
      }
      if (expectSeed && !(value.seedQuizzes > 0)) {
        const line = label + ': heavy progress was not in localStorage';
        console.error('FAIL ' + line);
        failures.push(line);
        continue;
      }
      if (!expectSeed && value.seedQuizzes > 0) {
        const line = label + ': empty pass saw saved progress';
        console.error('FAIL ' + line);
        failures.push(line);
        continue;
      }
      const overflow = value.overflow;
      const detail = 'overflow ' + Math.round(overflow) + 'px (document ' +
        Math.round(value.doc) + ', body ' + Math.round(value.body) + ', main ' + Math.round(value.main) + ')';
      const note = allow.get(rel);
      if (overflow > 0.5 && note) {
        console.log('OK   allowlisted ' + label + ' ' + detail + ' — ' + note);
        allowedOverflows.push(label + ' ' + detail);
      } else if (overflow > 0.5) {
        console.error('FAIL ' + label + ' ' + detail);
        failures.push(label + ' ' + detail);
      } else {
        console.log('OK   ' + label + ' ' + detail);
      }
    }
  }
  return { failures: failures, allowedOverflows: allowedOverflows };
}

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('FAIL Chrome not found. Set CHROME_PATH.');
    process.exit(1);
  }
  const server = await startServer();
  const httpPort = server.address().port;
  const debugPort = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ptce-pagefit-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--remote-allow-origins=*',
    '--user-data-dir=' + profile,
    '--remote-debugging-port=' + debugPort,
    '--window-size=1600,770',
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try { if (cdp) cdp.close(); } catch (e) { /* socket already closed */ }
    try { chrome.kill(); } catch (e) { /* already exited */ }
    try { server.close(); } catch (e) { /* already closed */ }
    setTimeout(() => {
      try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }); } catch (e) { /* profile may still be held */ }
    }, 200);
  };
  process.on('SIGINT', () => { stop(); process.exit(1); });

  try {
    const page = await waitJson(debugPort);
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.call('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.call('Page.enable');
    const empty = await runPass(cdp, httpPort, 'empty', PAGES, new Map(), false);
    const built = buildHeavyProgress();
    const sum = built.summary;
    console.log(
      'heavy seed: ' + sum.lessons + ' lessons complete, resume "' + sum.resume + '"; ' +
      sum.quizzes + ' quizzes on ' + sum.streakDays + ' consecutive days (streak); ' +
      sum.exams + ' exams; ' + sum.missed + ' missed; ' +
      sum.bookmarkedQuestions + ' bookmarked questions; ' +
      sum.bookmarkedCards + ' bookmarked cards; ' + sum.reviewed + ' cards reviewed'
    );
    const added = await cdp.call('Page.addScriptToEvaluateOnNewDocument', {
      source: heavySeedSource(built.progress)
    });
    const heavy = await runPass(cdp, httpPort, 'heavy', GLANCE, HEAVY_ALLOW, true);
    if (added && added.identifier) {
      await cdp.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: added.identifier });
    }
    const failures = empty.failures.concat(heavy.failures);
    if (failures.length) {
      console.error('FAIL ' + failures.length + ' page-fit check(s)');
      process.exitCode = 1;
    } else if (heavy.allowedOverflows.length) {
      console.log('OK   empty state fits. Heavy glance fits except the allowlisted Progress Dashboard (' + heavy.allowedOverflows.length + ' viewport check(s) scrolled, as expected).');
    } else {
      console.log('OK   empty state fits. Heavy glance fits, including the Progress Dashboard.');
    }
  } catch (err) {
    console.error('FAIL ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  } finally {
    stop();
  }
}

main();
