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

console.log('\nService worker');
const sw = read('sw.js');
if (!/ptce-2026-v4/.test(sw)) fail('sw.js cache version should be bumped to ptce-2026-v4');
else ok('sw.js cache is ptce-2026-v4');

console.log(failed ? '\nFAILED ' + failed + ' check(s)' : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
