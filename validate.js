#!/usr/bin/env node
'use strict';
/**
 * Minimal smoke checks — no test framework.
 * Run: node validate.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const DOMAINS = [
  'Medications',
  'Patient Safety and Quality Assurance',
  'Order Entry and Processing',
  'Federal Requirements'
];

let failed = 0;
function ok(msg) { console.log('  OK   ' + msg); }
function fail(msg) { console.error('  FAIL ' + msg); failed++; }

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function parseJSON(rel) {
  try {
    const data = JSON.parse(read(rel));
    ok('JSON.parse ' + rel);
    return data;
  } catch (err) {
    fail('JSON.parse ' + rel + ': ' + err.message);
    return null;
  }
}

console.log('Syntax (node --check)');
const jsFiles = [
  'js/app.js', 'js/quiz.js', 'js/exam.js', 'js/flashcards.js',
  'js/dashboard.js', 'js/notes.js', 'js/course.js', 'sw.js', 'validate.js'
];
for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' });
    ok(f);
  } catch (err) {
    fail(f + ': ' + (err.stderr || err.message).toString().trim());
  }
}

console.log('\nData files');
const questionsData = parseJSON('data/questions.json');
const flashData = parseJSON('data/flashcards.json');
const notesData = parseJSON('data/notes.json');
const courseData = parseJSON('data/course.json');

const questions = (questionsData && (questionsData.questions || questionsData)) || [];
const cards = (flashData && (flashData.cards || [])) || [];

if (questions.length) {
  const ids = questions.map(q => q.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) fail('duplicate question ids: ' + [...new Set(dup)].join(', '));
  else ok(questions.length + ' unique question ids');

  const badOpts = questions.filter(q => !Array.isArray(q.options) || q.options.length !== 4);
  if (badOpts.length) fail(badOpts.length + ' questions do not have exactly 4 options');
  else ok('all questions have 4 options');

  const badAns = questions.filter(q => !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3);
  if (badAns.length) fail(badAns.length + ' questions have out-of-range answers');
  else ok('all answers are in range 0–3');

  const emptyR = questions.filter(q => !q.rationale || !String(q.rationale).trim());
  if (emptyR.length) fail(emptyR.length + ' questions have empty rationales');
  else ok('all rationales are non-empty');

  const badDomain = questions.filter(q => !DOMAINS.includes(q.domain));
  if (badDomain.length) fail('unexpected question domains: ' + [...new Set(badDomain.map(q => q.domain))].join(', '));
  else ok('question domain names unchanged');

  const q065 = questions.find(q => q.id === 'q065');
  if (!q065) fail('q065 missing');
  else if (q065.subtopic === 'USP Standards') fail('q065 still tagged USP Standards');
  else if (!/PPPA|Pharmacy Law|Poison Prevention/i.test(q065.subtopic || '')) {
    fail('q065 subtopic should be PPPA (or equivalent law tag), got ' + JSON.stringify(q065.subtopic));
  } else ok('q065 subtopic is ' + q065.subtopic);

  const q023 = questions.find(q => q.id === 'q023');
  if (!q023) fail('q023 missing');
  else if (/\brequires\b.*refrigerat/i.test(q023.question)) fail('q023 stem still says refrigeration is required');
  else ok('q023 stem no longer requires refrigeration');

  const q127 = questions.find(q => q.id === 'q127');
  const q159 = questions.find(q => q.id === 'q159');
  if (!q127 || !q159) fail('q127 or q159 missing');
  else if (q127.question === q159.question) fail('q159 is still a near-dupe of q127');
  else ok('q159 differentiated from q127');

  const q160 = questions.find(q => q.id === 'q160');
  if (!q160) fail('q160 missing');
  else {
    if (/triplicate/i.test(q160.rationale) && !/discontinued|ended|no longer|single-sheet/i.test(q160.rationale)) {
      fail('q160 rationale still treats Form 222 as current triplicate');
    } else ok('q160 rationale does not treat Form 222 as current triplicate');
    if (/dispose|disposal|destroy/i.test(q160.rationale) && !/Form 41/i.test(q160.rationale)) {
      fail('q160 rationale still treats Form 222 as disposal without Form 41');
    } else ok('q160 rationale distinguishes Form 41 for destruction');
  }

  const q165 = questions.find(q => q.id === 'q165');
  if (!q165) fail('q165 missing');
  else if (!/CARA|patient|prescriber/i.test(q165.question) || !/30 days/i.test(q165.question + q165.options.join(' '))) {
    fail('q165 should test CARA 30-day patient/prescriber-requested C-II partials');
  } else ok('q165 tests CARA 30-day C-II partial fills');

  const federal = questions.filter(q => q.domain === 'Federal Requirements');
  if (federal.length < 40) fail('Federal bank should be ≥40 unique items, got ' + federal.length);
  else ok('Federal bank has ' + federal.length + ' questions');

  const remss = questions.filter(q => q.subtopic === 'REMS' && q.domain === 'Federal Requirements');
  if (remss.length < 5) fail('need ≥5 Federal REMS questions, got ' + remss.length);
  else ok(remss.length + ' Federal REMS questions');

  const q136 = questions.find(q => q.id === 'q136');
  if (!q136) fail('q136 missing');
  else if (q136.featured !== false) fail('q136 (alligation) should be featured:false');
  else ok('q136 alligation excluded from default featured path');

  const deadWaiver = questions.filter(q =>
    /X-waiver/i.test(JSON.stringify(q)) &&
    /required/i.test(q.question + q.options.join(' ') + q.rationale) &&
    !/no longer required|eliminated|was eliminated/i.test(q.question + q.options.join(' ') + q.rationale)
  );
  if (deadWaiver.length) fail('questions still treat X-waiver as current required law: ' + deadWaiver.map(q => q.id).join(', '));
  else ok('no question treats DATA 2000 X-waiver as current required law');
}

if (cards.length) {
  const ids = cards.map(c => c.id);
  const nonString = cards.filter(c => typeof c.id !== 'string');
  if (nonString.length) fail(nonString.length + ' flashcard ids are not strings');
  else ok('all ' + cards.length + ' flashcard ids are strings');

  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) fail('duplicate flashcard ids: ' + [...new Set(dup)].join(', '));
  else ok(cards.length + ' unique flashcard ids');

  const badDomain = cards.filter(c => !DOMAINS.includes(c.domain));
  if (badDomain.length) fail('unexpected flashcard domains: ' + [...new Set(badDomain.map(c => c.domain))].join(', '));
  else ok('flashcard domain names unchanged');
}

if (notesData) {
  const blob = JSON.stringify(notesData);
  if (/\bDATA 2000\b/.test(blob) && !/eliminated|no longer required|X-waiver was eliminated/i.test(blob)) {
    fail('notes still present DATA 2000 as current X-waiver law');
  } else ok('notes update DATA 2000 / X-waiver as eliminated');
  if (!/CARA/i.test(blob) || !/30 days/i.test(blob)) fail('notes missing CARA 30-day C-II partial-fill note');
  else ok('notes include CARA 30-day C-II partial fills');
  if (/Form 222[\s\S]{0,80}triplicate/i.test(blob) && !/not the old triplicate|single-sheet/i.test(blob)) {
    fail('notes still describe Form 222 as current triplicate');
  } else ok('notes Form 222 is single-sheet, not current triplicate');
}

console.log('\nChapter Test filter (quiz.js)');
const quizSrc = read('js/quiz.js');
const chapterBlock = /mode === 'chapter'[\s\S]*?q\.subtopic === subtopic[\s\S]*?else \{ \/\/ custom/;
if (!chapterBlock.test(quizSrc)) fail('startQuiz() chapter branch must filter by selected subtopic');
else ok('startQuiz() has a chapter branch that filters q.subtopic');

function filterChapter(pool, domain, subtopic) {
  let out = pool;
  if (domain && domain !== 'All') out = out.filter(q => q.domain === domain);
  if (subtopic) out = out.filter(q => q.subtopic === subtopic);
  return out;
}

if (questions.length) {
  const dea = filterChapter(questions, 'Federal Requirements', 'DEA Forms');
  if (!dea.length) fail('no DEA Forms questions to assert chapter filter');
  else if (!dea.every(q => q.domain === 'Federal Requirements' && q.subtopic === 'DEA Forms')) {
    fail('chapter filter leaked non-DEA Forms items');
  } else {
    const domainOnly = filterChapter(questions, 'Federal Requirements', '');
    if (domainOnly.length <= dea.length) fail('chapter domain-only pool should be larger than a single subtopic');
    else ok('chapter filter: Federal Requirements + DEA Forms → ' + dea.length + ' (domain-only ' + domainOnly.length + ')');
  }
}

console.log('\nHome copy');
const home = read('index.html');
if (/Timed questions with instant rationale/.test(home)) fail('index.html quiz card still claims timed/instant rationale');
else ok('index.html quiz card copy no longer claims a timer or instant rationale');
if (/class="hero"/.test(home)) fail('index.html still has the redundant hero block');
else ok('index.html hero block removed');
if (!/class="home"/.test(home)) fail('index.html body should have class="home" for desktop densify');
else ok('index.html body.home present');

console.log('\nService worker');
const sw = read('sw.js');
const appJs = read('js/app.js');
if (!/ptce-2026-v13/.test(sw)) fail('sw.js cache version should be bumped to ptce-2026-v13');
else ok('sw.js cache is ptce-2026-v13');
if (!/function networkFirst/.test(sw) || !/function isAppShell/.test(sw)) {
  fail('sw.js should serve the HTML/CSS/JS app shell network-first');
} else ok('sw.js app shell is network-first');
if (!/function cacheFirst/.test(sw) || !/isJsonData/.test(sw)) {
  fail('sw.js should keep cache-first for large JSON data');
} else ok('sw.js JSON data stays cache-first');
if (!/localhost/.test(appJs) || !/127\.0\.0\.1/.test(appJs) || !/::1/.test(appJs)) {
  fail('app.js should skip service worker registration on localhost, 127.0.0.1, and ::1');
} else if (!/unregister/.test(appJs)) {
  fail('app.js should unregister an existing service worker on local hosts');
} else ok('app.js skips SW registration and unregisters on local hosts');

console.log('\nFlashcards viewport layout');
const fcHtml = read('flashcards.html');
const css = read('css/style.css');
if (!/class="flashcards"/.test(fcHtml)) fail('flashcards.html body should have class="flashcards"');
else ok('flashcards.html body.flashcards present');
if (/\.flashcard\s*\{[^}]*min-height:\s*3[26]0px/.test(css)) fail('flashcard still forced to a 320/360px min-height');
else ok('flashcard min-height is no longer 320px or 360px');
if (/clamp\(180px,\s*32dvh,\s*280px\)/.test(css)) fail('flashcard should size to its content, not a tall viewport clamp');
else ok('flashcard height follows its content');
if (/body\.flashcards \.container\s*\{[^}]*overflow-y:\s*auto/.test(css)) fail('flashcards container must not be an inset scroller');
else ok('flashcards container does not scroll internally');
if (!/body\.flashcards \.container\s*\{[^}]*max-width:\s*1240px/.test(css)) fail('flashcards shell should use a wide centered max-width');
else ok('flashcards shell uses a wide centered max-width');
if (!/body\.flashcards \.container\s*\{[^}]*overflow:\s*visible/.test(css)) fail('flashcards container overflow should stay visible');
else ok('flashcards overflow stays on the document');
if (!/body\.flashcards\s*\{[^}]*height:\s*100dvh/.test(css)) fail('flashcards page should lock to the viewport height');
else ok('flashcards page locks to the viewport height');
if (!/body\.flashcards\s*\{[^}]*overflow:\s*hidden/.test(css)) fail('flashcards page should not scroll the document');
else ok('flashcards page clips document scroll');
if (/id="frontDomain"|id="backDomain"|class="domain-tag"/.test(fcHtml)) fail('domain tag should not be rendered on the card face');
else ok('domain tag is not rendered on the card face');
if (!/class="flashcard-wrap"[\s\S]*id="counter"[\s\S]*class="btn-row card-actions"/.test(fcHtml)) {
  fail('card counter should sit inside the flashcard wrap');
} else ok('card counter sits inside the flashcard chrome');
if (!/body\.flashcards \.card-counter\s*\{[^}]*position:\s*absolute/.test(css)) fail('card counter should be positioned inside the card');
else ok('card counter is positioned on the card');

console.log('\nQuiz density layout');
const quizHtml = read('quiz.html');
const examHtml = read('exam.html');
if (!/class="quiz"/.test(quizHtml)) fail('quiz.html body should have class="quiz"');
else ok('quiz.html body.quiz present');
if (!/class="exam"/.test(examHtml)) fail('exam.html body should have class="exam"');
else ok('exam.html body.exam present');
if (!/repeat\(2,\s*minmax\(0,\s*max-content\)\)/.test(css)) fail('answer choices should use a 2-column grid on wide screens');
else ok('answer choices use a 2-column grid');
if (!/choices\.layout-stack/.test(css)) fail('long choices should be able to stack in one column');
else ok('long choices can stack in one column');
if (!/class="header-title"/.test(quizHtml) || !/class="header-home"/.test(quizHtml)) {
  fail('quiz header should center a Quiz title and link Home');
} else ok('quiz header has centered title and Home link');
if (/class="crumb">Quiz</.test(quizHtml)) fail('quiz header still has a non-functional Quiz crumb');
else ok('non-functional Quiz crumb removed');
if (!/setup-primary/.test(quizHtml) || !/id="countRow"/.test(quizHtml)) {
  fail('quiz setup should place mode and count together');
} else ok('quiz setup keeps mode and count on one row');
if (!/id="exitQuizBtn"/.test(quizHtml) || !/id="headerExitBtn"/.test(quizHtml)) {
  fail('quiz should expose Exit controls');
} else ok('quiz Exit controls present');

console.log('\nDefault-path filters');
const examSrc = read('js/exam.js');
const quizSrcFull = read('js/quiz.js');
if (!/featured !== false/.test(examSrc)) fail('exam.js must skip featured:false items');
else ok('exam.js excludes featured:false from the default draw');
if (!/q\.featured !== false/.test(quizSrcFull) && !/featured !== false/.test(quizSrcFull)) {
  fail('quiz.js must skip featured:false in Quick 10 / weak modes');
} else ok('quiz.js excludes featured:false from Quick 10 / weak modes');
if (!/Escape/.test(quizSrcFull) || !/returnToSetup/.test(quizSrcFull)) {
  fail('quiz.js should exit on Esc and return to setup');
} else ok('quiz.js Esc exit returns to setup');

const courseSrc = read('js/course.js');
if (!/optional/.test(courseSrc) || !/archive-badge/.test(courseSrc)) {
  fail('course.js should render optional/archive lessons off the featured path');
} else ok('course.js labels optional 2026-archive lessons');

console.log(failed ? '\nFAILED ' + failed + ' check(s)' : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
