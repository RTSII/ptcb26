// Dashboard: local progress stats, domain accuracy, weak-area hint, quiz history
(function () {
  const { Storage, Util, DOMAINS } = window.App;

  function esc(s) { return Util.escapeHtml(String(s)); }

  function scoreOf(a) {
    return typeof a.score === 'number' ? a.score : Util.pct(a.correct || 0, a.total || 0);
  }

  function modeLabel(a) {
    if (a.mode === 'quick10') return 'Quick 10';
    if (a.mode === 'chapter') return 'Chapter: ' + (a.subtopic || a.domain || 'All');
    if (a.mode === 'custom') return 'Custom: ' + (a.domain || 'All');
    return 'Quiz';
  }

  function render(p, byDomain) {
    Util.el('#statQuizzes').textContent = p.quizzes.length;
    const avg = p.quizzes.length
      ? Math.round(p.quizzes.reduce(function (s, x) { return s + scoreOf(x); }, 0) / p.quizzes.length)
      : 0;
    Util.el('#statAvg').textContent = avg + '%';
    Util.el('#statCards').textContent = p.flashcards.reviewed.length;
    Util.el('#statExams').textContent = p.exams.length;

    const domRows = DOMAINS.map(function (d) {
      const v = byDomain[d] || { correct: 0, total: 0 };
      const pc = Util.pct(v.correct, v.total);
      return '<div class="domain-row"><div class="dr-head"><span>' + esc(d) +
        '</span><span>' + v.correct + '/' + v.total + ' (' + pc + '%)</span></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pc + '%"></div></div></div>';
    }).join('');
    Util.el('#domainAccuracy').innerHTML = domRows;

    let weak = null, weakPct = 101;
    DOMAINS.forEach(function (d) {
      const v = byDomain[d];
      if (v && v.total >= 3) {
        const pc = Util.pct(v.correct, v.total);
        if (pc < weakPct) { weakPct = pc; weak = d; }
      }
    });
    const weakEl = Util.el('#weakDomain');
    if (weak) {
      weakEl.innerHTML = '<strong>' + esc(weak) + '</strong> — ' + weakPct +
        '% correct. Review notes and flashcards for this domain, then run a focused quiz.';
    } else {
      weakEl.textContent = 'Complete some quizzes to reveal your weakest domain.';
    }

    const hist = p.quizzes.slice(0, 10);
    if (hist.length) {
      const h = hist.map(function (q) {
        const date = new Date(q.date);
        const when = isNaN(date) ? '' : date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return '<div class="hist-row"><span>' + esc(modeLabel(q)) + '<br><small class="muted">' + when +
          '</small></span><span class="hist-score">' + scoreOf(q) + '%</span></div>';
      }).join('');
      Util.el('#quizHistory').innerHTML = h;
    } else {
      Util.el('#quizHistory').innerHTML = '<p class="empty-state">No quiz attempts yet. Take a quiz!</p>';
    }

    const be = Util.el('#examHistory');
    if (p.exams.length) {
      const best = p.exams.reduce(function (m, x) {
        return scoreOf(x) > scoreOf(m) ? x : m;
      }, p.exams[0]);
      be.innerHTML = '<div class="score-big">' + scoreOf(best) + '%</div>' +
        '<div class="muted">' + (best.correct || 0) + '/' + (best.total || 0) + ' correct · ' +
        (best.scaled ? 'Scaled ' + best.scaled + ' · ' : '') +
        Util.formatDuration(best.duration) + ' · ' + new Date(best.date).toLocaleDateString() + '</div>';
    } else {
      be.innerHTML = '<p class="empty-state">No practice exams yet.</p>';
    }
  }

  function aggregateDomainAccuracy(p, questions) {
    const idMap = {};
    questions.forEach(function (q) { idMap[q.id] = q; });
    const byDomain = {};
    p.quizzes.concat(p.exams).forEach(function (attempt) {
      (attempt.questions || []).forEach(function (r) {
        const q = idMap[r.id];
        if (!q) return;
        const d = q.domain;
        if (!byDomain[d]) byDomain[d] = { correct: 0, total: 0 };
        byDomain[d].total++;
        if (r.correct) byDomain[d].correct++;
      });
    });
    return byDomain;
  }

  Util.el('#resetBtn').addEventListener('click', function () {
    if (confirm('Reset all saved progress? This cannot be undone.')) {
      Storage.clear();
      location.reload();
    }
  });

  const progress = Storage.read();
  Util.fetchJSON('data/questions.json')
    .then(function (data) {
      render(progress, aggregateDomainAccuracy(progress, data.questions || data || []));
    })
    .catch(function () {
      render(progress, {});
    });
})();
