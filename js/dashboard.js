/* Dashboard: stats, domain accuracy, weak domain, history, reset */
(function () {
  "use strict";
  var P = window.PTCE;

  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  function render() {
    var p = P.getProgress();

    // Top stats
    var quizzes = p.quizzes || [];
    var exams = p.exams || [];
    var avg = 0;
    if (quizzes.length) {
      var sum = quizzes.reduce(function (a, q) { return a + P.pct(q.correct, q.total); }, 0);
      avg = Math.round(sum / quizzes.length);
    }
    document.getElementById("statQuizzes").textContent = quizzes.length;
    document.getElementById("statAvg").textContent = avg + "%";
    document.getElementById("statCards").textContent = p.cardsReviewed || 0;
    document.getElementById("statExams").textContent = exams.length;

    // Domain accuracy
    var agg = P.domainAccuracy();
    var hasData = P.DOMAINS.some(function (d) { return agg[d].total > 0; });
    if (hasData) {
      var html = P.DOMAINS.map(function (d) {
        var a = agg[d]; var pc = P.pct(a.correct, a.total);
        return '<div class="domain-row"><div class="dr-head"><span>' + P.domainLabel(d) +
          '</span><span>' + (a.total ? a.correct + '/' + a.total + ' (' + pc + '%)' : 'no data') +
          '</span></div><div class="bar-track"><div class="bar-fill" style="width:' + pc + '%"></div></div></div>';
      }).join("");
      document.getElementById("domainAccuracy").innerHTML = html;

      // Weak domain (lowest accuracy among those with data)
      var weak = null;
      P.DOMAINS.forEach(function (d) {
        if (agg[d].total > 0) {
          var pc = P.pct(agg[d].correct, agg[d].total);
          if (weak === null || pc < weak.pc) weak = { d: d, pc: pc };
        }
      });
      if (weak) {
        document.getElementById("weakDomain").innerHTML =
          '<p><strong>' + P.domainLabel(weak.d) + '</strong> — ' + weak.pc + '% accuracy.</p>' +
          '<p class="muted" style="margin-top:6px;">Focus here. ' +
          '<a href="quiz.html">Practice this domain →</a></p>';
      }
    }

    // Quiz history
    if (quizzes.length) {
      var qh = quizzes.slice(0, 10).map(function (q) {
        var pc = P.pct(q.correct, q.total);
        return '<div class="domain-row"><div class="dr-head"><span>' +
          (q.domain === "All" ? "All Domains" : P.domainLabel(q.domain)) +
          ' · ' + fmtDate(q.date) + '</span><span>' + pc + '%</span></div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + pc + '%"></div></div></div>';
      }).join("");
      document.getElementById("quizHistory").innerHTML = qh;
    }

    // Best exam
    if (exams.length) {
      var best = exams.reduce(function (a, b) { return b.scaled > a.scaled ? b : a; });
      var pc = P.pct(best.correct, best.total);
      var passed = best.scaled >= 1400;
      document.getElementById("examHistory").innerHTML =
        '<p>Best scaled score: <strong style="color:' + (passed ? '#1f9d55' : '#d64545') + '">' +
        best.scaled + '</strong> (' + pc + '%, ' + best.correct + '/' + best.total + ')</p>' +
        '<p class="muted" style="margin-top:4px;">' + exams.length + ' exam(s) completed · last ' + fmtDate(exams[0].date) + '</p>';
    }
  }

  document.getElementById("resetBtn").addEventListener("click", function () {
    if (confirm("Reset all progress? This cannot be undone.")) {
      P.resetProgress();
      location.reload();
    }
  });

  render();
})();
