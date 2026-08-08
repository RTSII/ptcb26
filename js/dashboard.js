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
    renderTrend(p);

    const weakEl = Util.el('#weakDomain');
    if (weak) {
      weakEl.innerHTML = '<strong>' + esc(weak) + '</strong> — ' + weakPct +
        '% correct. Use the buttons below to drill it.';
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

  function renderTrend(p) {
    const chart = Util.el('#trendChart');
    const all = p.quizzes.slice(0, 15).reverse(); // oldest -> newest
    if (!all.length) { chart.innerHTML = '<p class="muted">Take quizzes to see your score trend.</p>'; return; }
    const bars = all.map(function (a) {
      const s = scoreOf(a);
      const h = Math.max(4, s);
      const color = s >= 80 ? 'var(--green)' : (s >= 60 ? 'var(--cyan)' : 'var(--pink)');
      return '<div class="trend-bar" title="' + esc(modeLabel(a)) + ' — ' + s + '%">' +
        '<div class="trend-fill" style="height:' + h + '%;background:' + color + ';"></div>' +
        '<span class="trend-val">' + s + '</span></div>';
    }).join('');
    chart.innerHTML = '<div class="trend-chart">' + bars + '</div>' +
      '<p class="muted center" style="margin-top:6px;">Last ' + all.length + ' quiz score(s), oldest → newest</p>';
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

  // Export progress to a JSON download
  Util.el('#exportBtn').addEventListener('click', function () {
    const blob = new Blob([Storage.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ptce2026-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // Import progress from a JSON file
  Util.el('#importFile').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        Storage.importJSON(reader.result);
        location.reload();
      } catch (err) {
        alert('Import failed: not a valid progress file.');
      }
    };
    reader.readAsText(file);
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
