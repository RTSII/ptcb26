// Practice Exam: PTCE 2026 blueprint distribution, navigable, final score report
(function () {
  const { Storage, Util, DOMAINS } = window.App;

  const EXAM_WEIGHTS = {
    'Medications': 40,
    'Patient Safety and Quality Assurance': 26.25,
    'Order Entry and Processing': 21.25,
    'Federal Requirements': 12.5
  };

  let bank = [];
  let exam = [];        // { q, choice }
  let current = 0;
  const settings = { length: 90, timer: 6600 }; // default 110 min
  let timerId = null, timeLeft = 0, startTime = 0;

  const el = {
    intro: Util.el('#introScreen'),
    exam: Util.el('#examScreen'),
    result: Util.el('#examResultScreen'),
    blueprintBars: Util.el('#blueprintBars'),
    lengthPick: Util.el('#lengthPick'),
    examTimerPick: Util.el('#examTimerPick'),
    startExamBtn: Util.el('#startExamBtn'),
    examProgress: Util.el('#examProgress'),
    examTimer: Util.el('#examTimer'),
    examProgressFill: Util.el('#examProgressFill'),
    examQuestionCard: Util.el('#examQuestionCard'),
    examPrevBtn: Util.el('#examPrevBtn'),
    examNextBtn: Util.el('#examNextBtn'),
    submitExamBtn: Util.el('#submitExamBtn'),
    answeredCount: Util.el('#answeredCount')
  };

  function generateExamQuestions(questions) {
    const byDomain = Util.groupBy(questions, 'domain');
    const distribution = [
      { domain: 'Medications', count: 36 },
      { domain: 'Patient Safety and Quality Assurance', count: 24 },
      { domain: 'Order Entry and Processing', count: 19 },
      { domain: 'Federal Requirements', count: 11 }
    ];

    let examQuestions = [];
    let warnings = [];

    distribution.forEach(({ domain, count }) => {
      const pool = byDomain[domain] || [];
      if (pool.length === 0) {
        warnings.push(`No questions available for ${domain}`);
        return;
      }
      const sampled = Util.sample(pool, Math.min(count, pool.length));
      examQuestions.push(...sampled);
      if (pool.length < count) {
        warnings.push(`${domain}: only ${pool.length} available (${count} needed)`);
      }
    });

    return { questions: examQuestions, warnings };
  }

  // Scale the 90-question blueprint distribution to a shorter exam length
  function generateScaledExam(questions, total) {
    const byDomain = Util.groupBy(questions, 'domain');
    const blueprint = [
      { domain: 'Medications', count: 36 },
      { domain: 'Patient Safety and Quality Assurance', count: 24 },
      { domain: 'Order Entry and Processing', count: 19 },
      { domain: 'Federal Requirements', count: 11 }
    ];

    let running = 0;
    const distribution = blueprint.map(({ domain, count }) => {
      const scaled = Math.round(count * total / 90);
      running += scaled;
      return { domain, count: scaled };
    });
    distribution[0].count += total - running; // absorb rounding drift on Medications

    let examQuestions = [];
    distribution.forEach(({ domain, count }) => {
      const pool = byDomain[domain] || [];
      examQuestions.push(...Util.sample(pool, Math.min(count, pool.length)));
    });
    return examQuestions;
  }

  function renderBlueprint() {
    el.blueprintBars.innerHTML = DOMAINS.map(function (d) {
      const w = EXAM_WEIGHTS[d];
      return '<div class="domain-row"><div class="dr-head"><span>' + d +
        '</span><span>' + w + '%</span></div><div class="bar-track"><div class="bar-fill" style="width:' +
        w + '%"></div></div></div>';
    }).join('');
  }

  function pills(container, options, initial, onPick) {
    container.innerHTML = '';
    options.forEach(function (opt) {
      const b = document.createElement('button');
      b.className = 'pill' + (opt.value === initial ? ' active' : '');
      b.textContent = opt.label;
      b.addEventListener('click', function () {
        container.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
        b.classList.add('active');
        onPick(opt.value);
      });
      container.appendChild(b);
    });
  }

  function buildSetup() {
    pills(el.lengthPick, [
      { label: '30 (short)', value: 30 },
      { label: '60 (mid)', value: 60 },
      { label: '90 (full)', value: 90 }
    ], 90, function (v) { settings.length = v; });
    pills(el.examTimerPick, [
      { label: 'No timer', value: 0 },
      { label: '60 min', value: 3600 },
      { label: '110 min (real)', value: 6600 }
    ], 6600, function (v) { settings.timer = v; });
  }

  function startExam() {
    const picked = settings.length === 90
      ? generateExamQuestions(bank).questions
      : generateScaledExam(bank, settings.length);
    exam = Util.shuffle(picked).map(function (q) { return { q: q, choice: null }; });
    if (!exam.length) return;
    current = 0;
    el.intro.classList.add('hidden');
    el.result.classList.add('hidden');
    el.exam.classList.remove('hidden');
    startTime = Date.now();
    startTimer();
    renderQuestion();
  }

  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function startTimer() {
    stopTimer();
    if (!settings.timer) { el.examTimer.textContent = 'No timer'; return; }
    timeLeft = settings.timer;
    el.examTimer.textContent = fmt(timeLeft);
    timerId = setInterval(function () {
      timeLeft--;
      el.examTimer.textContent = fmt(timeLeft);
      if (timeLeft <= 60) el.examTimer.classList.add('warn');
      if (timeLeft <= 0) { stopTimer(); finish(); }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function renderQuestion() {
    const item = exam[current];
    const q = item.q;
    el.examProgress.textContent = (current + 1) + ' / ' + exam.length;
    el.examProgressFill.style.width = ((current + 1) / exam.length * 100) + '%';

    const opts = q.options.map(function (opt, i) {
      const letter = String.fromCharCode(65 + i);
      return '<button class="option' + (item.choice === i ? ' selected' : '') + '" data-i="' + i +
        '"><span class="letter">' + letter + '</span><span>' + Util.escapeHtml(opt) + '</span></button>';
    }).join('');

    el.examQuestionCard.innerHTML =
      '<div class="q-domain">' + Util.escapeHtml(q.domain) + (q.subtopic ? ' • ' + Util.escapeHtml(q.subtopic) : '') + '</div>' +
      '<div class="q-text">' + Util.escapeHtml(q.question) + '</div>' +
      '<div class="options">' + opts + '</div>';

    el.examQuestionCard.querySelectorAll('.option').forEach(function (b) {
      if (item.choice === parseInt(b.dataset.i, 10)) {
        b.style.borderColor = '#05d9e8';
        b.style.boxShadow = '0 0 12px rgba(5, 217, 232, 0.45)';
        b.querySelector('.letter').style.background = '#ffd319';
        b.querySelector('.letter').style.color = '#030014';
        b.querySelector('.letter').style.borderColor = '#ffd319';
      }
      b.addEventListener('click', function () {
        item.choice = parseInt(b.dataset.i, 10);
        renderQuestion();
      });
    });

    el.examPrevBtn.disabled = current === 0;
    if (current === exam.length - 1) {
      el.examNextBtn.classList.add('hidden');
      el.submitExamBtn.classList.remove('hidden');
    } else {
      el.examNextBtn.classList.remove('hidden');
      el.submitExamBtn.classList.add('hidden');
    }
    const answeredN = exam.filter(function (x) { return x.choice !== null; }).length;
    el.answeredCount.textContent = answeredN + ' of ' + exam.length + ' answered';
  }

  function finish() {
    stopTimer();
    const duration = Date.now() - startTime;
    let correct = 0;
    const byDomain = {};
    exam.forEach(function (item) {
      const d = item.q.domain;
      if (!byDomain[d]) byDomain[d] = { correct: 0, total: 0 };
      byDomain[d].total++;
      if (item.choice === item.q.answer) { correct++; byDomain[d].correct++; }
    });
    const score = Util.pct(correct, exam.length);
    // approximate PTCB scaled score (1000-1600 range, ~1400 pass)
    const scaled = Math.round(1000 + (score / 100) * 600);
    const passed = scaled >= 1400;

    Storage.recordExam({
      date: new Date().toISOString(),
      mode: 'exam',
      total: exam.length,
      correct: correct,
      score: score,
      scaled: scaled,
      duration: duration,
      questions: exam.map(function (item) {
        return { id: item.q.id, correct: item.choice === item.q.answer };
      })
    });

    const breakdown = DOMAINS.map(function (d) {
      const b = byDomain[d] || { correct: 0, total: 0 };
      const pc = Util.pct(b.correct, b.total);
      return '<div class="domain-row"><div class="dr-head"><span>' + d +
        '</span><span>' + b.correct + '/' + b.total + ' (' + pc + '%)</span></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pc + '%"></div></div></div>';
    }).join('');

    const cls = passed ? 'pass' : 'fail';
    el.exam.classList.add('hidden');
    el.result.classList.remove('hidden');
    el.result.innerHTML =
      '<div class="score-card"><div class="score-label">Approx. Scaled Score</div>' +
      '<div class="score-big ' + cls + '">' + scaled + '</div>' +
      '<div class="score-label">' + correct + ' of ' + exam.length + ' correct (' + score + '%) · ' +
      Util.formatDuration(duration) + ' · ' +
      (passed ? '<strong style="color:#1f9d55">PASS</strong>' : '<strong style="color:#d64545">Below passing</strong>') +
      '</div><div class="domain-breakdown">' + breakdown + '</div></div>' +
      '<div class="btn-row" style="justify-content:center;">' +
      '<button class="btn gold" id="retakeBtn">Retake Exam</button>' +
      '<a class="btn outline" href="dashboard.html">View Dashboard</a></div>' +
      '<p class="muted center" style="margin-top:10px;">Scaled score is an approximation for study purposes only.</p>';
    document.getElementById('retakeBtn').addEventListener('click', function () {
      el.result.classList.add('hidden');
      el.intro.classList.remove('hidden');
    });
  }

  el.startExamBtn.addEventListener('click', startExam);
  el.examNextBtn.addEventListener('click', function () { if (current < exam.length - 1) { current++; renderQuestion(); } });
  el.examPrevBtn.addEventListener('click', function () { if (current > 0) { current--; renderQuestion(); } });
  el.submitExamBtn.addEventListener('click', function () {
    const unanswered = exam.filter(function (x) { return x.choice === null; }).length;
    if (unanswered > 0 && !confirm(unanswered + ' question(s) unanswered. Submit anyway?')) return;
    finish();
  });

  async function init() {
    try {
      const data = await Util.fetchJSON('data/questions.json');
      const allQuestions = data.questions || data || [];
      const { questions: examQuestions, warnings } = generateExamQuestions(allQuestions);

      if (warnings.length) {
        console.warn('Exam generation warnings:', warnings);
        // Display warning to user if bank is insufficient
        if (allQuestions.length < 90) {
          alert(`Warning: Question bank has ${allQuestions.length} questions. This exam contains ${examQuestions.length} unique questions (target: 90). Expand question bank for full mock exams.`);
        }
      }

      bank = allQuestions;
      renderBlueprint();
      buildSetup();
    } catch (err) {
      console.error(err);
      el.intro.style.display = 'none';
      Util.el('#loadError').style.display = 'block';
    }
  }

  init();
})();
