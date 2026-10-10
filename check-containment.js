#!/usr/bin/env node
'use strict';
/**
 * Headless lesson containment check. Invoked by validate.js.
 * Loads every lesson at 1366x768 and fails if a key-points panel clips
 * its items, or a key-points panel or lesson-card child overflows its
 * container border.
 *
 * Run: node check-containment.js
 * Chrome: CHROME_PATH, or google-chrome / chromium on PATH.
 */
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const WIDTH = 1366;
const HEIGHT = 768;
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
  const card = document.querySelector('#lessonView');
  const title = document.querySelector('.lesson-title-main');
  const layout = document.querySelector('.lesson-layout');
  if (!card || !title || !layout) return null;
  const fails = [];
  function rect(el) {
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
  }
  function spills(child, parent) {
    const c = rect(child);
    const p = rect(parent);
    if (c.w === 0 && c.h === 0) return false;
    return c.l < p.l - 1 || c.r > p.r + 1 || c.t < p.t - 1 || c.b > p.b + 1;
  }
  for (const child of card.children) {
    if (spills(child, card)) {
      fails.push('card child .' + (child.className || child.tagName) + ' overflows #lessonView border');
    }
  }
  const kp = layout.querySelector('.key-points');
  if (kp) {
    const scroll = kp.scrollHeight - kp.clientHeight;
    if (scroll > 1) fails.push('key-points clips (internal scroll ' + scroll + 'px)');
    const cs = getComputedStyle(kp);
    const box = rect(kp);
    const inner = {
      l: box.l + (parseFloat(cs.borderLeftWidth) || 0),
      t: box.t + (parseFloat(cs.borderTopWidth) || 0),
      r: box.r - (parseFloat(cs.borderRightWidth) || 0),
      b: box.b - (parseFloat(cs.borderBottomWidth) || 0)
    };
    let outside = 0;
    for (const node of kp.querySelectorAll('h3, li')) {
      const r = rect(node);
      if (r.w === 0 && r.h === 0) continue;
      if (r.l < inner.l - 1 || r.r > inner.r + 1 || r.t < inner.t - 1 || r.b > inner.b + 1) outside++;
    }
    if (outside) fails.push('key-points clips or overflows (' + outside + ' item(s) outside the border)');
    const lay = rect(layout);
    if (box.l < lay.l - 1 || box.r > lay.r + 1) {
      fails.push('key-points overflows .lesson-layout border');
    }
    const topIn = box.t - lay.t + layout.scrollTop;
    const bottomIn = topIn + box.h;
    if (topIn < -1 || bottomIn > layout.scrollHeight + 1) {
      fails.push('key-points overflows .lesson-layout border');
    }
  }
  return fails;
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
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
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
          }, timeoutMs || 15000);
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

function lessonIds() {
  const course = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/course.json'), 'utf8'));
  const ids = [];
  (course.modules || []).forEach((mod) => {
    (mod.lessons || []).forEach((lesson) => ids.push(lesson.id));
  });
  return ids;
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

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('FAIL Chrome not found. Set CHROME_PATH.');
    process.exit(1);
  }
  const ids = lessonIds();
  if (!ids.length) {
    console.error('FAIL no lessons in data/course.json');
    process.exit(1);
  }
  const server = await startServer();
  const httpPort = server.address().port;
  const debugPort = await freePort();
  const profile = fs.mkdtempSync(path.join(require('os').tmpdir(), 'ptce-contain-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--remote-allow-origins=*',
    '--user-data-dir=' + profile,
    '--remote-debugging-port=' + debugPort,
    '--window-size=' + WIDTH + ',' + HEIGHT,
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
    try {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    } catch (e) { /* profile can outlive the check; Chrome may still hold it */ }
  };
  process.on('SIGINT', () => { stop(); process.exit(1); });

  try {
    const page = await waitJson(debugPort);
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.call('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.call('Page.enable');
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 1,
      mobile: false
    });
    const failures = [];
    for (const id of ids) {
      const url = 'http://127.0.0.1:' + httpPort + '/course.html?lesson=' + encodeURIComponent(id);
      await cdp.call('Page.navigate', { url });
      let fails = null;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 50));
        const ev = await cdp.call('Runtime.evaluate', {
          expression: MEASURE,
          returnByValue: true
        });
        const value = ev && ev.result && ev.result.value;
        if (value) { fails = value; break; }
      }
      if (!fails) failures.push(id + ': lesson did not render');
      else if (fails.length) failures.push(id + ': ' + fails.join('; '));
    }
    if (failures.length) {
      failures.forEach((line) => console.error('FAIL ' + line));
      console.error('FAIL ' + failures.length + ' lesson(s) at ' + WIDTH + 'x' + HEIGHT);
      process.exitCode = 1;
    } else {
      console.log('OK   ' + ids.length + ' lessons at ' + WIDTH + 'x' + HEIGHT + ': no key-points or card-child clip');
    }
  } catch (err) {
    console.error('FAIL ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  } finally {
    stop();
  }
}

main();
