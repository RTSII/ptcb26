// Study Course: module list, lesson reader, progress tracking, test-yourself links
(function () {
  const { Storage, Util } = window.App;

  const listView = Util.el('#courseList');
  const lessonView = Util.el('#lessonView');
  const loadErrorEl = Util.el('#loadError');

  let course = null;
  let moduleIndex = new Map(); // moduleId -> module
  let lessonIndex = new Map(); // lessonId -> { module, lesson, flatIndex }
  let flatLessons = [];        // [{module, lesson}] in course order
  let currentFlat = 0;

  function esc(s) { return Util.escapeHtml(String(s)); }

  function buildIndexes() {
    moduleIndex.clear();
    lessonIndex.clear();
    flatLessons = [];
    course.modules.forEach(function (m) {
      moduleIndex.set(m.id, m);
      m.lessons.forEach(function (l) {
        lessonIndex.set(l.id, { module: m, lesson: l, flatIndex: flatLessons.length });
        flatLessons.push({ module: m, lesson: l });
      });
    });
  }

  function progress() { return Storage.getCourseProgress(); }
  function isDone(id) { return progress().completed.includes(id); }

  function overallPct() {
    const total = flatLessons.length;
    const done = progress().completed.length;
    return total ? Math.round((done / total) * 100) : 0;
  }

  function quizUrl(mod) {
    const q = mod.quiz || { domain: mod.domain, count: 10 };
    return 'quiz.html?mode=custom&domain=' + encodeURIComponent(q.domain) + '&count=' + (q.count || 10);
  }

  function renderList() {
    const p = progress();
    const done = new Set(p.completed);
    const pct = overallPct();

    let html = '<div class="course-overall">' +
      '<div class="course-overall-head"><span>Course Progress</span><span>' + done.size + ' / ' + flatLessons.length + ' lessons (' + pct + '%)</span></div>' +
      '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      (p.lastLesson ? '<a class="btn gold" style="margin-top:12px;" href="course.html?lesson=' + encodeURIComponent(p.lastLesson) + '">Resume: ' + esc(lessonIndex.get(p.lastLesson).lesson.title) + '</a>' : '') +
      '</div>';

    html += course.modules.map(function (m) {
      const total = m.lessons.length;
      const completed = m.lessons.filter(l => done.has(l.id)).length;
      const mpct = total ? Math.round((completed / total) * 100) : 0;
      const lessons = m.lessons.map(function (l) {
        const d = done.has(l.id);
        return '<a class="lesson-link' + (d ? ' done' : '') + '" href="course.html?lesson=' + encodeURIComponent(l.id) + '">' +
          '<span class="lesson-check">' + (d ? '✓' : '○') + '</span>' +
          '<span class="lesson-title">' + esc(l.title) + '</span></a>';
      }).join('');
      return '<details class="module' + (mpct === 100 ? ' module-complete' : '') + '">' +
        '<summary>' +
          '<span class="module-title">' + esc(m.title) + '</span>' +
          '<span class="module-meta">' + completed + '/' + total + '</span>' +
        '</summary>' +
        '<div class="module-body">' +
          '<p class="module-desc">' + esc(m.desc) + '</p>' +
          '<div class="bar-track module-bar"><div class="bar-fill" style="width:' + mpct + '%"></div></div>' +
          '<div class="lesson-list">' + lessons + '</div>' +
          '<a class="btn gold module-quiz" href="' + quizUrl(m) + '">Test Yourself: ' + esc(m.domain) + ' Quiz</a>' +
        '</div>' +
        '</details>';
    }).join('');

    listView.innerHTML = html;
  }

  function renderLesson(lessonId) {
    const entry = lessonIndex.get(lessonId);
    if (!entry) { showList(); return; }
    const { module: m, lesson: l, flatIndex } = entry;
    currentFlat = flatIndex;
    Storage.setLastLesson(lessonId);

    const prev = flatLessons[flatIndex - 1];
    const next = flatLessons[flatIndex + 1];
    const done = isDone(lessonId);

    let html = '<div class="lesson-header">' +
      '<span class="crumb">' + esc(m.domain) + '</span>' +
      '<span class="lesson-domain">' + esc(m.title) + '</span>' +
      '</div>' +
      '<h2 class="lesson-title-main">' + esc(l.title) + '</h2>' +
      '<p class="lesson-intro">' + esc(l.intro) + '</p>' +
      '<div class="lesson-body"><ul>' +
      l.bullets.map(b => '<li>' + esc(b) + '</li>').join('') +
      '</ul></div>' +
      (l.keyPoints && l.keyPoints.length ?
        '<div class="key-points"><h3>⭐ Key Points to Remember</h3><ul>' +
        l.keyPoints.map(k => '<li>' + esc(k) + '</li>').join('') +
        '</ul></div>' : '') +
      '<div class="lesson-actions">' +
        '<button class="btn ' + (done ? 'outline' : 'gold') + '" id="completeBtn">' + (done ? '✓ Completed' : 'Mark Complete') + '</button>' +
        '<a class="btn" href="' + quizUrl(m) + '">Test This Module</a>' +
      '</div>' +
      '<div class="lesson-nav">' +
        (prev ? '<a class="btn ghost" href="course.html?lesson=' + encodeURIComponent(prev.lesson.id) + '">‹ ' + esc(prev.lesson.title) + '</a>' : '<span></span>') +
        '<a class="btn ghost" href="course.html">All Modules</a>' +
        (next ? '<a class="btn ghost" href="course.html?lesson=' + encodeURIComponent(next.lesson.id) + '">' + esc(next.lesson.title) + ' ›</a>' : '<span></span>') +
      '</div>';

    lessonView.innerHTML = html;

    Util.el('#completeBtn').addEventListener('click', function () {
      if (!isDone(lessonId)) {
        Storage.markLessonComplete(lessonId);
        renderLesson(lessonId); // re-render to show completed state
      }
    });
  }

  function showList() {
    lessonView.style.display = 'none';
    listView.style.display = 'block';
    renderList();
    document.title = 'Study Course · PTCE 2026';
  }

  function showLesson(lessonId) {
    listView.style.display = 'none';
    lessonView.style.display = 'block';
    renderLesson(lessonId);
    document.title = 'Lesson · PTCE 2026';
    window.scrollTo(0, 0);
  }

  function route() {
    const params = new URLSearchParams(location.search);
    const lessonId = params.get('lesson');
    if (lessonId && lessonIndex.has(lessonId)) showLesson(lessonId);
    else showList();
  }

  window.addEventListener('popstate', route);

  // Intercept in-page navigation to update without full reload
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="course.html"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname) {
      e.preventDefault();
      history.pushState({}, '', a.href);
      route();
    }
  });

  Util.fetchJSON('data/course.json')
    .then(function (data) {
      course = data;
      buildIndexes();
      route();
    })
    .catch(function (err) {
      console.error(err);
      listView.style.display = 'none';
      loadErrorEl.style.display = 'block';
    });
})();
