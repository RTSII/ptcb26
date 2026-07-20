/* PTCE 2026 - shared utilities, data loading, localStorage helpers */
(function (global) {
  "use strict";

  var STORAGE_KEY = "ptce2026_progress_v1";

  var DOMAINS = [
    "Medications",
    "Patient Safety",
    "Order Entry",
    "Federal Requirements"
  ];

  // PTCE 2026 domain weights (used for the practice exam blueprint)
  var DOMAIN_WEIGHTS = {
    "Medications": 40,
    "Patient Safety": 26.25,
    "Order Entry": 21.25,
    "Federal Requirements": 12.5
  };

  var DOMAIN_LABELS = {
    "Medications": "Medications",
    "Patient Safety": "Patient Safety & QA",
    "Order Entry": "Order Entry & Processing",
    "Federal Requirements": "Federal Requirements"
  };

  /* ---------- Data loading (works over file:// and http) ---------- */
  function loadJSON(path) {
    return fetch(path, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      });
  }

  /* ---------- localStorage progress store ---------- */
  function defaultProgress() {
    return {
      cardsReviewed: 0,
      quizzes: [],   // { date, domain, total, correct, byDomain:{dom:{correct,total}} }
      exams: []      // { date, total, correct, scaled, byDomain:{...} }
    };
  }

  function getProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProgress();
      var p = JSON.parse(raw);
      if (!p.quizzes) p.quizzes = [];
      if (!p.exams) p.exams = [];
      if (typeof p.cardsReviewed !== "number") p.cardsReviewed = 0;
      return p;
    } catch (e) {
      return defaultProgress();
    }
  }

  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    catch (e) { /* storage may be unavailable */ }
  }

  function resetProgress() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function incrementCardsReviewed(n) {
    var p = getProgress();
    p.cardsReviewed += (n || 1);
    saveProgress(p);
  }

  function recordQuiz(entry) {
    var p = getProgress();
    entry.date = new Date().toISOString();
    p.quizzes.unshift(entry);
    if (p.quizzes.length > 50) p.quizzes = p.quizzes.slice(0, 50);
    saveProgress(p);
  }

  function recordExam(entry) {
    var p = getProgress();
    entry.date = new Date().toISOString();
    p.exams.unshift(entry);
    if (p.exams.length > 30) p.exams = p.exams.slice(0, 30);
    saveProgress(p);
  }

  /* Aggregate accuracy per domain across all quizzes + exams */
  function domainAccuracy() {
    var p = getProgress();
    var agg = {};
    DOMAINS.forEach(function (d) { agg[d] = { correct: 0, total: 0 }; });
    function merge(byDomain) {
      if (!byDomain) return;
      Object.keys(byDomain).forEach(function (d) {
        if (!agg[d]) agg[d] = { correct: 0, total: 0 };
        agg[d].correct += byDomain[d].correct || 0;
        agg[d].total += byDomain[d].total || 0;
      });
    }
    p.quizzes.forEach(function (q) { merge(q.byDomain); });
    p.exams.forEach(function (e) { merge(e.byDomain); });
    return agg;
  }

  /* ---------- Helpers ---------- */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pct(correct, total) {
    if (!total) return 0;
    return Math.round((correct / total) * 100);
  }

  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(global.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function domainLabel(d) { return DOMAIN_LABELS[d] || d; }

  global.PTCE = {
    STORAGE_KEY: STORAGE_KEY,
    DOMAINS: DOMAINS,
    DOMAIN_WEIGHTS: DOMAIN_WEIGHTS,
    DOMAIN_LABELS: DOMAIN_LABELS,
    loadJSON: loadJSON,
    getProgress: getProgress,
    saveProgress: saveProgress,
    resetProgress: resetProgress,
    incrementCardsReviewed: incrementCardsReviewed,
    recordQuiz: recordQuiz,
    recordExam: recordExam,
    domainAccuracy: domainAccuracy,
    shuffle: shuffle,
    pct: pct,
    getParam: getParam,
    formatTime: formatTime,
    domainLabel: domainLabel
  };
})(window);
