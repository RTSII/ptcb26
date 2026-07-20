/* Practice Exam: weighted by PTCE 2026 domain blueprint, navigable, final score report */
(function () {
  "use strict";
  var P = window.PTCE;

  var bank = [];
  var exam = [];        // { q, choice }
  var current = 0;
  var settings = { length: 90, timer: 6600 }; // default 110 min
  var timerId = null, timeLeft = 0;

  var el = {
    intro: document.getElementById("introScreen"),
    exam: document.getElementById("examScreen"),
    result: document.getElementById("examResultScreen"),
    blueprintBars: document.getElementById("blueprintBars"),
    lengthPick: document.getElementById("lengthPick"),
    examTimerPick: document.getElementById("examTimerPick"),
    startExamBtn: document.getElementById("startExamBtn"),
    examProgress: document.getElementById("examProgress"),
    examTimer: document.getElementById("examTimer"),
    examProgressFill: document.getElementById("examProgressFill"),
    examQuestionCard: document.getElementById("examQuestionCard"),
    examPrevBtn: document.getElementById("examPrevBtn"),
    examNextBtn: document.getElementById("examNextBtn"),
    submitExamBtn: document.getElementById("submitExamBtn"),
    answeredCount: document.getElementById("answeredCount")
  };

  function renderBlueprint() {
    var html = P.DOMAINS.map(function (d) {
      var w = P.DOMAIN_WEIGHTS[d];
      return '<div class="domain-row"><div class="dr-head"><span>' + P.domainLabel(d) +
        '</span><span>' + w + '%</span></div><div class="bar-track"><div class="bar-fill" style="width:' +
        w + '%"></div></div></div>';
    }).join("");
    el.blueprintBars.innerHTML = html;
  }

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
    pills(el.lengthPick, [
      { label: "30 (short)", value: 30 },
      { label: "60 (mid)", value: 60 },
      { label: "90 (full)", value: 90 }
    ], 90, function (v) { settings.length = v; });
    pills(el.examTimerPick, [
      { label: "No timer", value: 0 },
      { label: "60 min", value: 3600 },
      { label: "110 min (real)", value: 6600 }
    ], 6600, function (v) { settings.timer = v; });
  }

  // Build a weighted set. Sample without replacement per domain; if a domain
  // pool is too small for its target, cycle through reshuffled copies.
  function buildExam(total) {
    var byDom = {};
    P.DOMAINS.forEach(function (d) { byDom[d] = P.shuffle(bank.filter(function (q) { return q.domain === d; })); });

    // target counts from weights, rounded, then fix to total
    var targets = {};
    var running = 0;
    P.DOMAINS.forEach(function (d) {
      targets[d] = Math.round(total * P.DOMAIN_WEIGHTS[d] / 100);
      running += targets[d];
    });
    // adjust rounding drift on the largest domain (Medications)
    targets["Medications"] += (total - running);

    var chosen = [];
    P.DOMAINS.forEach(function (d) {
      var pool = byDom[d];
      var need = Math.max(0, targets[d]);
      if (!pool.length) return;
      for (var i = 0; i < need; i++) {
        if (i > 0 && i % pool.length === 0) pool = P.shuffle(pool); // reshuffle when cycling
        chosen.push({ q: pool[i % pool.length], choice: null });
      }
    });
    return P.shuffle(chosen).slice(0, total);
  }

  function startExam() {
    exam = buildExam(settings.length);
    if (!exam.length) return;
    current = 0;
    el.intro.classList.add("hidden");
    el.result.classList.add("hidden");
    el.exam.classList.remove("hidden");
    startTimer();
    renderQuestion();
  }

  function startTimer() {
    stopTimer();
    if (!settings.timer) { el.examTimer.textContent = "No timer"; return; }
    timeLeft = settings.timer;
    el.examTimer.textContent = P.formatTime(timeLeft);
    timerId = setInterval(function () {
      timeLeft--;
      el.examTimer.textContent = P.formatTime(timeLeft);
      if (timeLeft <= 60) el.examTimer.classList.add("warn");
      if (timeLeft <= 0) { stopTimer(); finish(); }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function renderQuestion() {
    var item = exam[current];
    var q = item.q;
    el.examProgress.textContent = (current + 1) + " / " + exam.length;
    el.examProgressFill.style.width = ((current + 1) / exam.length * 100) + "%";

    var opts = q.options.map(function (opt, i) {
      var letter = String.fromCharCode(65 + i);
      var sel = item.choice === i ? " correct" : "";
      // during exam we only show which is selected (navy highlight), not right/wrong
      return '<button class="option' + (item.choice === i ? " selected" : "") + '" data-i="' + i +
        '"><span class="letter">' + letter + '</span><span>' + opt + '</span></button>';
    }).join("");

    el.examQuestionCard.innerHTML =
      '<div class="q-domain">' + P.domainLabel(q.domain) + '</div>' +
      '<div class="q-text">' + q.question + '</div>' +
      '<div class="options">' + opts + '</div>';

    el.examQuestionCard.querySelectorAll(".option").forEach(function (b) {
      if (item.choice === parseInt(b.dataset.i, 10)) {
        b.style.borderColor = "#0b1f3a";
        b.querySelector(".letter").style.background = "#d4a437";
        b.querySelector(".letter").style.color = "#071528";
      }
      b.addEventListener("click", function () {
        item.choice = parseInt(b.dataset.i, 10);
        renderQuestion();
      });
    });

    el.examPrevBtn.disabled = current === 0;
    if (current === exam.length - 1) {
      el.examNextBtn.classList.add("hidden");
      el.submitExamBtn.classList.remove("hidden");
    } else {
      el.examNextBtn.classList.remove("hidden");
      el.submitExamBtn.classList.add("hidden");
    }
    var answeredN = exam.filter(function (x) { return x.choice !== null; }).length;
    el.answeredCount.textContent = answeredN + " of " + exam.length + " answered";
  }

  function finish() {
    stopTimer();
    var correct = 0;
    var byDomain = {};
    exam.forEach(function (item) {
      var d = item.q.domain;
      if (!byDomain[d]) byDomain[d] = { correct: 0, total: 0 };
      byDomain[d].total++;
      if (item.choice === item.q.answer) { correct++; byDomain[d].correct++; }
    });
    var score = P.pct(correct, exam.length);
    // approximate PTCB scaled score (1000-1600 range, ~1400 pass)
    var scaled = Math.round(1000 + (score / 100) * 600);
    var passed = scaled >= 1400;

    P.recordExam({ total: exam.length, correct: correct, scaled: scaled, byDomain: byDomain });

    var breakdown = P.DOMAINS.map(function (d) {
      var b = byDomain[d] || { correct: 0, total: 0 };
      var pc = P.pct(b.correct, b.total);
      return '<div class="domain-row"><div class="dr-head"><span>' + P.domainLabel(d) +
        '</span><span>' + b.correct + '/' + b.total + ' (' + pc + '%)</span></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pc + '%"></div></div></div>';
    }).join("");

    var cls = passed ? "pass" : "fail";
    el.exam.classList.add("hidden");
    el.result.classList.remove("hidden");
    el.result.innerHTML =
      '<div class="score-card"><div class="score-label">Approx. Scaled Score</div>' +
      '<div class="score-big ' + cls + '">' + scaled + '</div>' +
      '<div class="score-label">' + correct + ' of ' + exam.length + ' correct (' + score + '%) · ' +
      (passed ? '<strong style="color:#1f9d55">PASS</strong>' : '<strong style="color:#d64545">Below passing</strong>') +
      '</div><div class="domain-breakdown">' + breakdown + '</div></div>' +
      '<div class="btn-row" style="justify-content:center;">' +
      '<button class="btn gold" id="retakeBtn">Retake Exam</button>' +
      '<a class="btn outline" href="dashboard.html">View Dashboard</a></div>' +
      '<p class="muted center" style="margin-top:10px;">Scaled score is an approximation for study purposes only.</p>';
    document.getElementById("retakeBtn").addEventListener("click", function () {
      el.result.classList.add("hidden");
      el.intro.classList.remove("hidden");
    });
  }

  el.startExamBtn.addEventListener("click", startExam);
  el.examNextBtn.addEventListener("click", function () { if (current < exam.length - 1) { current++; renderQuestion(); } });
  el.examPrevBtn.addEventListener("click", function () { if (current > 0) { current--; renderQuestion(); } });
  el.submitExamBtn.addEventListener("click", function () {
    var unanswered = exam.filter(function (x) { return x.choice === null; }).length;
    if (unanswered > 0 && !confirm(unanswered + " question(s) unanswered. Submit anyway?")) return;
    finish();
  });

  P.loadJSON("data/questions.json")
    .then(function (data) {
      bank = data.questions || [];
      renderBlueprint();
      buildSetup();
    })
    .catch(function () {
      el.intro.innerHTML = '<p class="empty-state">Could not load questions. If opening the file directly, run a local server (see README).</p>';
    });
})();
