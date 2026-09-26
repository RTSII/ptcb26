// Quiz module: Quick 10, Chapter Test, Custom, Missed Review, Weak-area modes
(async function () {
  const { Storage, Util, DOMAINS } = window.App;

  const params = new URLSearchParams(location.search);
  const initialMode = params.get('mode') || 'quick10';

  const setupEl = Util.el('#setup');
  const quizEl = Util.el('#quiz');
  const resultsEl = Util.el('#results');
  const loadErrorEl = Util.el('#loadError');

  const modeSel = Util.el('#mode');
  const domainSel = Util.el('#domain');
  const subtopicSel = Util.el('#subtopic');
  const diffSel = Util.el('#difficulty');
  const countInput = Util.el('#count');
  const startBtn = Util.el('#startBtn');

  const qnum = Util.el('#qnum');
  const qdomain = Util.el('#qdomain');
  const qtext = Util.el('#qtext');
  const choicesEl = Util.el('#choices');
  const prevBtn = Util.el('#prevBtn');
  const nextBtn = Util.el('#nextBtn');
  const progBar = Util.el('#progBar');
  const bookmarkBtn = Util.el('#bookmarkBtn');
  const headerExitBtn = Util.el('#headerExitBtn');
  const exitQuizBtn = Util.el('#exitQuizBtn');

  const scoreLine = Util.el('#scoreLine');
  const scoreBar = Util.el('#scoreBar');
  const reviewEl = Util.el('#review');
  const retryBtn = Util.el('#retryBtn');

  let allQuestions = [];
  let session = [];
  let idx = 0;
  let answers = [];
  let startTime = 0;
  let pendingLeave = null;

  const exitDialog = Util.el('#exitDialog');
  const exitDialogText = Util.el('#exitDialogText');
  const exitCancelBtn = Util.el('#exitCancelBtn');
  const exitConfirmBtn = Util.el('#exitConfirmBtn');

  // Initialize
  const validModes = ['quick10', 'chapter', 'custom', 'missed', 'bookmarked', 'weak', 'weaksub'];
  const startMode = validModes.includes(initialMode) ? initialMode : (initialMode === 'quick' ? 'quick10' : 'quick10');
  modeSel.value = startMode;
  toggleModeFields();
  await loadData();

  // Deep-link support: e.g. course lessons link to quiz.html?mode=custom&domain=Medications&count=15
  const urlDomain = params.get('domain');
  if (urlDomain && ['chapter', 'custom', 'weak', 'weaksub'].includes(startMode)) {
    if (Array.from(domainSel.options).some(o => o.value === urlDomain)) {
      domainSel.value = urlDomain;
      updateSubtopics();
    }
  }
  const urlCount = parseInt(params.get('count'), 10);
  if (urlCount && !countInput.disabled) {
    countInput.value = Math.min(50, Math.max(5, urlCount));
  }
  const urlSubtopic = params.get('subtopic');
  if (urlSubtopic && Array.from(subtopicSel.options).some(o => o.value === urlSubtopic)) {
    subtopicSel.value = urlSubtopic;
  }

  // Events
  modeSel.addEventListener('change', toggleModeFields);
  domainSel.addEventListener('change', updateSubtopics);
  startBtn.addEventListener('click', startQuiz);
  prevBtn.addEventListener('click', () => nav(-1));
  nextBtn.addEventListener('click', () => nav(1));
  retryBtn.addEventListener('click', () => location.reload());
  bookmarkBtn.addEventListener('click', toggleCurrentBookmark);
  headerExitBtn.addEventListener('click', () => offerExit('setup'));
  exitQuizBtn.addEventListener('click', () => offerExit('setup'));
  exitCancelBtn.addEventListener('click', () => exitDialog.close());
  exitConfirmBtn.addEventListener('click', () => {
    const kind = pendingLeave;
    pendingLeave = null;
    exitDialog.close();
    completeLeave(kind);
  });
  exitDialog.addEventListener('cancel', () => { pendingLeave = null; });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || exitDialog.open || quizEl.style.display === 'none') return;
    e.preventDefault();
    offerExit('setup');
  });
  Util.el('.app-header').addEventListener('click', (e) => {
    const link = e.target.closest('a[href="index.html"]');
    if (!link || quizEl.style.display === 'none' || !hasAnswers()) return;
    e.preventDefault();
    offerExit('home');
  });

  function toggleModeFields() {
    const mode = modeSel.value;
    const domainRow = Util.el('#domainRow');
    const subtopicRow = Util.el('#subtopicRow');
    const diffRow = Util.el('#diffRow');
    const extras = Util.el('#setupExtras');

    const showDomain = ['chapter', 'custom', 'weak', 'weaksub'].includes(mode);
    const showSub = mode === 'chapter' || mode === 'weaksub';
    const showDiff = mode === 'custom' || mode === 'weak' || mode === 'weaksub';
    // quick10 is fixed at 10; missed and bookmarked use the full stored pools.
    const showCount = mode === 'chapter' || mode === 'custom' || mode === 'weak' || mode === 'weaksub';
    const countRow = Util.el('#countRow');
    domainRow.hidden = !showDomain;
    subtopicRow.hidden = !showSub;
    diffRow.hidden = !showDiff;
    countRow.hidden = !showCount;
    if (extras) extras.hidden = !(showDomain || showSub || showDiff);

    if (!showCount) {
      countInput.disabled = true;
      if (mode === 'quick10') countInput.value = 10;
    } else {
      countInput.disabled = false;
      if (mode === 'chapter') countInput.value = 10;
    }
    if (mode === 'chapter' || mode === 'weak' || mode === 'weaksub') updateSubtopics();
  }

  async function loadData() {
    try {
      const data = await Util.fetchJSON('data/questions.json');
      allQuestions = data.questions || data || [];
      if (!allQuestions.length) throw new Error('No questions found');
      populateDomains();
    } catch (err) {
      console.error(err);
      setupEl.style.display = 'none';
      loadErrorEl.style.display = 'block';
    }
  }

  const DOMAIN_LABELS = {
    'Patient Safety and Quality Assurance': 'Patient Safety & Q.A.',
    'Order Entry and Processing': 'Order Entry & Processing'
  };

  function populateDomains() {
    const available = new Set(allQuestions.map(q => q.domain));
    DOMAINS.forEach(d => {
      if (available.has(d) && !Array.from(domainSel.options).some(o => o.value === d)) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = DOMAIN_LABELS[d] || d;
        domainSel.appendChild(opt);
      }
    });
  }

  function updateSubtopics() {
    const domain = domainSel.value;
    subtopicSel.innerHTML = '<option value="">All</option>';
    if (domain === 'All') return;
    const subs = [...new Set(allQuestions
      .filter(q => q.domain === domain)
      .map(q => q.subtopic)
      .filter(Boolean))].sort();
    subs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      subtopicSel.appendChild(opt);
    });
  }

  // accuracy map from all recorded attempts
  function accuracyBy(fn) {
    const acc = {};
    Storage.read().quizzes.concat(Storage.read().exams).forEach(a => {
      (a.questions || []).forEach(r => {
        const q = allQuestions.find(x => x.id === r.id);
        if (!q) return;
        const k = fn(q);
        if (!k) return;
        if (!acc[k]) acc[k] = { c: 0, t: 0 };
        acc[k].t++;
        if (r.correct) acc[k].c++;
      });
    });
    return acc;
  }

  function weakestKey(acc) {
    let key = null, worst = 101;
    Object.keys(acc).forEach(k => {
      if (acc[k].t >= 3) {
        const p = (acc[k].c / acc[k].t) * 100;
        if (p < worst) { worst = p; key = k; }
      }
    });
    return key;
  }

  function isFeatured(q) { return q.featured !== false; }

  function startQuiz() {
    const mode = modeSel.value;
    const domain = domainSel.value;
    const subtopic = subtopicSel.value;
    const difficulty = diffSel.value;
    let pool = allQuestions;

    if (mode === 'quick10') {
      pool = Util.sample(allQuestions.filter(isFeatured), 10);
    } else if (mode === 'missed') {
      const missedIds = new Set(Storage.getMissed());
      pool = allQuestions.filter(q => missedIds.has(q.id));
      pool = Util.shuffle(pool);
      if (!pool.length) {
        alert('No missed questions yet. Complete a quiz or exam first.');
        return;
      }
    } else if (mode === 'bookmarked') {
      const bmIds = new Set(Storage.getBookmarks('question'));
      pool = allQuestions.filter(q => bmIds.has(q.id));
      pool = Util.shuffle(pool);
      if (!pool.length) {
        alert('No bookmarked questions yet. Tap the star while taking a quiz or exam.');
        return;
      }
    } else if (mode === 'weak') {
      const acc = accuracyBy(q => q.domain);
      const weakDomain = domain !== 'All' ? domain : (weakestKey(acc) || null);
      pool = pool.filter(isFeatured);
      pool = weakDomain ? pool.filter(q => q.domain === weakDomain) : pool;
      if (difficulty) pool = pool.filter(q => q.difficulty === difficulty);
      pool = Util.sample(pool, Math.min(parseInt(countInput.value) || 10, pool.length));
    } else if (mode === 'weaksub') {
      const acc = accuracyBy(q => q.subtopic);
      const weakSub = subtopic || weakestKey(acc);
      pool = pool.filter(isFeatured);
      if (weakSub) pool = pool.filter(q => q.subtopic === weakSub);
      if (domain !== 'All') pool = pool.filter(q => q.domain === domain);
      if (difficulty) pool = pool.filter(q => q.difficulty === difficulty);
      pool = Util.sample(pool, Math.min(parseInt(countInput.value) || 10, pool.length));
    } else if (mode === 'chapter') {
      // Chapter Test: domain + selected subtopic (empty subtopic = all in domain)
      if (domain !== 'All') pool = pool.filter(q => q.domain === domain);
      if (subtopic) pool = pool.filter(q => q.subtopic === subtopic);
      pool = Util.sample(pool, Math.min(parseInt(countInput.value) || 10, pool.length));
    } else { // custom
      if (domain !== 'All') pool = pool.filter(q => q.domain === domain);
      if (difficulty) pool = pool.filter(q => q.difficulty === difficulty);
      pool = Util.sample(pool, Math.min(parseInt(countInput.value) || 10, pool.length));
    }

    if (!pool.length) {
      alert('No questions available for this selection.');
      return;
    }

    session = pool;
    answers = new Array(session.length).fill(null);
    idx = 0;
    startTime = Date.now();

    setupEl.style.display = 'none';
    quizEl.style.display = 'block';
    resultsEl.style.display = 'none';
    headerExitBtn.hidden = false;
    render();
  }

  function hasAnswers() {
    return answers.some((a) => a !== null);
  }

  // Exit / Esc returns to setup. Home and the logo go to index.html.
  // Either path confirms only after at least one answer has been chosen.
  function offerExit(kind) {
    if (quizEl.style.display === 'none') return;
    if (!hasAnswers()) {
      completeLeave(kind);
      return;
    }
    pendingLeave = kind;
    const goingHome = kind === 'home';
    exitDialogText.textContent = goingHome
      ? 'Leave this quiz and go home? Your progress will be discarded.'
      : 'Exit this quiz and return to setup? Your progress will be discarded.';
    exitConfirmBtn.textContent = goingHome ? 'Go home' : 'Exit';
    if (!exitDialog.open) exitDialog.showModal();
    exitCancelBtn.focus();
  }

  function completeLeave(kind) {
    if (kind === 'home') {
      location.href = 'index.html';
      return;
    }
    returnToSetup();
  }

  function returnToSetup() {
    quizEl.style.display = 'none';
    resultsEl.style.display = 'none';
    setupEl.style.display = '';
    headerExitBtn.hidden = true;
    session = [];
    answers = [];
    idx = 0;
    modeSel.focus();
  }

  function render() {
    const q = session[idx];
    qnum.textContent = `Question ${idx + 1}/${session.length}`;
    qdomain.textContent = q.subtopic ? `${q.domain} • ${q.subtopic}` : q.domain;
    qtext.textContent = q.question;
    updateBookmarkBtn();

    choicesEl.innerHTML = '';
    const longestChoice = q.options.reduce((max, opt) => Math.max(max, opt.length), 0);
    choicesEl.classList.toggle('layout-stack', longestChoice > 140);
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice' + (answers[idx] === i ? ' selected' : '');
      btn.innerHTML = `<strong>${String.fromCharCode(65 + i)}.</strong><span class="choice-label">${Util.escapeHtml(opt)}</span>`;
      btn.onclick = () => {
        answers[idx] = i;
        Util.els('.choice', choicesEl).forEach(c => c.classList.remove('selected'));
        btn.classList.add('selected');
      };
      choicesEl.appendChild(btn);
    });

    progBar.style.width = `${((idx + 1) / session.length) * 100}%`;
    prevBtn.disabled = idx === 0;
    nextBtn.textContent = idx === session.length - 1 ? 'Finish' : 'Next';
  }

  function updateBookmarkBtn() {
    const on = Storage.isBookmarked('question', session[idx].id);
    bookmarkBtn.classList.toggle('bookmarked', on);
    bookmarkBtn.textContent = on ? '★ Bookmarked' : '☆ Bookmark';
    bookmarkBtn.setAttribute('aria-pressed', on);
  }

  function toggleCurrentBookmark() {
    if (!session[idx]) return;
    Storage.toggleBookmark('question', session[idx].id);
    updateBookmarkBtn();
  }

  function nav(delta) {
    if (delta === 1 && idx === session.length - 1) {
      finish();
      return;
    }
    idx = Math.max(0, Math.min(session.length - 1, idx + delta));
    render();
  }

  function finish() {
    const duration = Date.now() - startTime;
    let correct = 0;
    const results = session.map((q, i) => {
      const isCorrect = answers[i] === q.answer;
      if (isCorrect) correct++;
      return { ...q, userAnswer: answers[i], isCorrect };
    });

    const score = Util.pct(correct, session.length);
    quizEl.style.display = 'none';
    resultsEl.style.display = 'block';
    headerExitBtn.hidden = true;
    scoreLine.textContent = `Score: ${correct}/${session.length} (${score}%) • ${Util.formatDuration(duration)}`;
    scoreBar.style.width = `${score}%`;

    Storage.recordQuiz({
      date: new Date().toISOString(),
      mode: modeSel.value,
      domain: domainSel.value,
      subtopic: subtopicSel.value || null,
      total: session.length,
      correct: correct,
      score: score,
      duration: duration,
      questions: results.map(r => ({ id: r.id, correct: r.isCorrect }))
    });

    reviewEl.innerHTML = '<h3>Review</h3>' + results.map((r, i) => `
      <div class="review-item ${r.isCorrect ? 'correct' : 'incorrect'}">
        <p><strong>Q${i + 1}:</strong> ${Util.escapeHtml(r.question)}</p>
        <p>Your answer: <strong>${r.userAnswer !== null ? Util.escapeHtml(r.options[r.userAnswer]) : '—'}</strong></p>
        <p>Correct answer: <strong>${Util.escapeHtml(r.options[r.answer])}</strong></p>
        <p class="rationale"><em>${Util.escapeHtml(r.rationale)}</em></p>
      </div>
    `).join('');
  }
})();
