/* Quiz mode: domain filter, timer, instant rationale, scoring */
(function () {
  "use strict";
  var P = window.PTCE;

  var bank = [];
  var quiz = [];
  var current = 0;
  var correctCount = 0;
  var byDomain = {};
  var answered = false;
  var settings = { domain: "All", count: 10, timer: 0 };
  var timerId = null, timeLeft = 0;

  var el = {
    setup: document.getElementById("setupScreen"),
    quiz: document.getElementById("quizScreen"),
    result: document.getElementById("resultScreen"),
    domainPick: document.getElementById("domainPick"),
    countPick: document.getElementById("countPick"),
    timerPick: document.getElementById("timerPick"),
    startBtn: document.getElementById("startBtn"),
    qProgress: document.getElementById("qProgress"),
    timer: document.getElementById("timer"),
    progressFill: document.getElementById("progressFill"),
    questionCard: document.getElementById("questionCard"),
    quitBtn: document.getElementById("quitBtn"),
    nextQBtn: document.getElementById("nextQBtn")
  };

  function pills(container, options, initial, onPick) {
    container.innerHTML = "";
    options.forEach(function (opt) {
      var b = document.createElement("button");
      b.className = "pill" + (opt.value === initial ? " active" : "");
      b.textContent = opt.label;
      b.addEventListener("click", function () {
        container.querySelectorAll(".pill").forEach(function (p) { p.classList.remove("active"); });
        b.classList.add("active");
        onPick(opt.value);
      });
      container.appendChild(b);
    });
  }

  function buildSetup() {
    var domOpts = [{ label: "All Domains", value: "All" }].concat(P.DOMAINS.map(function (d) {
      return { label: P.domainLabel(d), value: d };
    }));
    pills(el.domainPick, domOpts, "All", function (v) { settings.domain = v; });
    pills(el.countPick, [
      { label: "5", value: 5 }, { label: "10", value: 10 },
      { label: "20", value: 20 }, { label: "All", value: 999 }
    ], 10, function (v) { settings.count = v; });
    pills(el.timerPick, [
      { label: "No timer", value: 0 }, { label: "30s / Q", value: 30 },
      { label: "60s / Q", value: 60 }
    ], 0, function (v) { settings.timer = v; });
  }

  function startQuiz() {
    var pool = settings.domain === "All" ? bank : bank.filter(function (q) { return q.domain === settings.domain; });
    pool = P.shuffle(pool);
    var n = settings.count === 999 ? pool.length : Math.min(settings.count, pool.length);
    quiz = pool.slice(0, n);
    if (!quiz.length) return;
    current = 0; correctCount = 0; byDomain = {};
    el.setup.classList.add("hidden");
    el.result.classList.add("hidden");
    el.quiz.classList.remove("hidden");
    renderQuestion();
  }

  function startTimer() {
    stopTimer();
    if (!settings.timer) { el.timer.textContent = "No timer"; el.timer.classList.remove("warn"); return; }
    timeLeft = settings.timer;
    el.timer.classList.remove("warn");
    el.timer.textContent = P.formatTime(timeLeft);
    timerId = setInterval(function () {
      timeLeft--;
      el.timer.textContent = P.formatTime(timeLeft);
      if (timeLeft <= 5) el.timer.classList.add("warn");
      if (timeLeft <= 0) { stopTimer(); if (!answered) autoReveal(); }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function renderQuestion() {
    answered = false;
    el.nextQBtn.classList.add("hidden");
    var q = quiz[current];
    el.qProgress.textContent = "Question " + (current + 1) + " of " + quiz.length;
    el.progressFill.style.width = ((current) / quiz.length * 100) + "%";

    var opts = q.options.map(function (opt, i) {
      var letter = String.fromCharCode(65 + i);
      return '<button class="option" data-i="' + i + '"><span class="letter">' + letter + '</span><span>' + opt + '</span></button>';
    }).join("");

    el.questionCard.innerHTML =
      '<div class="q-domain">' + P.domainLabel(q.domain) + '</div>' +
      '<div class="q-text">' + q.question + '</div>' +
      '<div class="options">' + opts + '</div>' +
      '<div class="rationale" id="rationale"><strong>Rationale:</strong> ' + q.rationale + '</div>';

    el.questionCard.querySelectorAll(".option").forEach(function (b) {
      b.addEventListener("click", function () { selectAnswer(parseInt(b.dataset.i, 10)); });
    });
    startTimer();
  }

  function autoReveal() { selectAnswer(-1); }

  function selectAnswer(choice) {
    if (answered) return;
    answered = true;
    stopTimer();
    var q = quiz[current];
    if (!byDomain[q.domain]) byDomain[q.domain] = { correct: 0, total: 0 };
    byDomain[q.domain].total++;

    var opts = el.questionCard.querySelectorAll(".option");
    opts.forEach(function (b) {
      b.classList.add("disabled");
      var i = parseInt(b.dataset.i, 10);
      if (i === q.answer) b.classList.add("correct");
      if (i === choice && choice !== q.answer) b.classList.add("wrong");
    });
    if (choice === q.answer) { correctCount++; byDomain[q.domain].correct++; }

    document.getElementById("rationale").classList.add("show");
    el.progressFill.style.width = ((current + 1) / quiz.length * 100) + "%";
    el.nextQBtn.classList.remove("hidden");
    el.nextQBtn.textContent = current === quiz.length - 1 ? "See Results" : "Next ›";
  }

  function nextQuestion() {
    if (!answered) return;
    if (current === quiz.length - 1) { finish(); return; }
    current++;
    renderQuestion();
  }

  function finish() {
    stopTimer();
    P.recordQuiz({
      domain: settings.domain,
      total: quiz.length,
      correct: correctCount,
      byDomain: byDomain
    });
    var score = P.pct(correctCount, quiz.length);
    var cls = score >= 66 ? "pass" : "fail";
    var breakdown = Object.keys(byDomain).map(function (d) {
      var b = byDomain[d]; var pc = P.pct(b.correct, b.total);
      return '<div class="domain-row"><div class="dr-head"><span>' + P.domainLabel(d) +
        '</span><span>' + b.correct + '/' + b.total + ' (' + pc + '%)</span></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pc + '%"></div></div></div>';
    }).join("");

    el.quiz.classList.add("hidden");
    el.result.classList.remove("hidden");
    el.result.innerHTML =
      '<div class="score-card"><div class="score-big ' + cls + '">' + score + '%</div>' +
      '<div class="score-label">' + correctCount + ' of ' + quiz.length + ' correct</div>' +
      '<div class="domain-breakdown">' + breakdown + '</div></div>' +
      '<div class="btn-row" style="justify-content:center;">' +
      '<button class="btn gold" id="againBtn">New Quiz</button>' +
      '<a class="btn outline" href="dashboard.html">View Dashboard</a></div>';
    document.getElementById("againBtn").addEventListener("click", function () {
      el.result.classList.add("hidden");
      el.setup.classList.remove("hidden");
    });
  }

  el.startBtn.addEventListener("click", startQuiz);
  el.nextQBtn.addEventListener("click", nextQuestion);
  el.quitBtn.addEventListener("click", function () {
    stopTimer();
    el.quiz.classList.add("hidden");
    el.setup.classList.remove("hidden");
  });

  P.loadJSON("data/questions.json")
    .then(function (data) {
      bank = data.questions || [];
      buildSetup();
      // Quick 10 shortcut
      if (P.getParam("mode") === "quick") {
        settings = { domain: "All", count: 10, timer: 0 };
        startQuiz();
      }
    })
    .catch(function () {
      el.setup.innerHTML = '<p class="empty-state">Could not load questions. If opening the file directly, run a local server (see README).</p>';
    });
})();
