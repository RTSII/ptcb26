#!/usr/bin/env node
'use strict';
/**
 * Empty-state page overflow. Invoked by validate.js.
 * Loads every top-level page at 1600x770 (primary) and 1366x768
 * (secondary) with a fresh profile (no saved progress). Fails when the
 * document, the body, or the page's main container overflows by more
 * than half a pixel, unless the page is on ALLOW.
 *
 * ALLOW is only for a page whose empty state is genuinely taller than
 * the laptop viewport. Do not list a short page to hide a phantom scrollbar.
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
const ALLOW = new Set([
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
  let settled = document.readyState === 'complete';
  if (path.endsWith('/course.html')) settled = settled && !!document.querySelector('#courseList .nx-domain-card');
  if (path.endsWith('/notes.html')) settled = settled && !!document.querySelector('#notesArea .nx-domain-card');
  if (path.endsWith('/dashboard.html')) settled = settled && !!document.querySelector('#domainAccuracy .domain-row, #domainAccuracy p');
  if (path.endsWith('/flashcards.html')) settled = settled && !!document.querySelector('#flashcard');
  if (path.endsWith('/index.html')) settled = settled && !!document.querySelector('.hx-grid');
  if (path.endsWith('/quiz.html')) settled = settled && !!document.querySelector('#setup');
  if (path.endsWith('/exam.html')) settled = settled && !!document.querySelector('#introScreen');
  const overflow = Math.max(docPx, bodyPx, mainPx);
  return {
    settled: settled,
    overflow: overflow,
    doc: docPx,
    body: bodyPx,
    main: mainPx
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

  const failures = [];
  try {
    const page = await waitJson(debugPort);
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.call('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.call('Page.enable');
    for (const size of SIZES) {
      await cdp.call('Emulation.setDeviceMetricsOverride', {
        width: size[0],
        height: size[1],
        deviceScaleFactor: 1,
        mobile: false
      });
      for (const rel of PAGES) {
        const label = size[0] + 'x' + size[1] + ' ' + rel;
        await cdp.call('Page.navigate', { url: 'http://127.0.0.1:' + httpPort + rel });
        const value = await measure(cdp);
        if (!value || !value.settled) {
          const line = label + ': page did not render';
          console.error('FAIL ' + line);
          failures.push(line);
          continue;
        }
        const overflow = value.overflow;
        const detail = 'overflow ' + Math.round(overflow) + 'px (document ' +
          Math.round(value.doc) + ', body ' + Math.round(value.body) + ', main ' + Math.round(value.main) + ')';
        const allowed = ALLOW.has(rel);
        if (overflow > 0.5 && !allowed) {
          console.error('FAIL ' + label + ' ' + detail);
          failures.push(label + ' ' + detail);
        } else if (overflow > 0.5 && allowed) {
          console.log('OK   allowlisted ' + label + ' ' + detail);
        } else {
          console.log('OK   ' + label + ' ' + detail);
        }
      }
    }
    if (failures.length) {
      console.error('FAIL ' + failures.length + ' page(s) overflow in the empty state');
      process.exitCode = 1;
    } else if (ALLOW.size) {
      console.log('OK   empty-state page fit; allowlisted: ' + [...ALLOW].join(', '));
    } else {
      console.log('OK   every top-level page at 1600x770 and 1366x768: no empty-state overflow');
    }
  } catch (err) {
    console.error('FAIL ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  } finally {
    stop();
  }
}

main();
